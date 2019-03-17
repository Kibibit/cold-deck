import bodyParser from 'body-parser';
import express, { Router } from 'express';
import partials from 'express-partials';
import session from 'express-session';
import methodOverride from 'method-override';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import flash from 'connect-flash';
import { isEmpty, isArray } from 'lodash';
import marked from 'marked';
import Octokit from '@octokit/rest';

interface KbGithubClient {
  githubClientId: string;
  githubClientSecret: string;
  redirectUrl: string;
}

export function kbAuthenticatedRoute(githubClient: KbGithubClient, allowedOrganization?: string, allowedUsers?: string[]) {
  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.  However, since this example does not
  //   have a database of user records, the complete GitHub profile is serialized
  //   and deserialized.
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });

  // Use the GitHubStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, and GitHub
  //   profile), and invoke a callback with a user object.
  passport.use(new GitHubStrategy({
    clientID: githubClient.githubClientId,
    clientSecret: githubClient.githubClientSecret,
    callbackURL: githubClient.redirectUrl
  },
    function (accessToken, refreshToken, profile, done) {
      const octokit = new Octokit({
        auth: `token ${ accessToken }`
      });

      octokit.orgs.listForAuthenticatedUser()
        .then((result) => {
          const organizations = result.data.map((organization) => organization.login.toLowerCase());

          profile.organizations = organizations;

          if (allowedOrganization && organizations.indexOf(allowedOrganization) < 0) {
            return done(null, false, {
              message: `Only members of [${ allowedOrganization }](https://github.com/${ allowedOrganization }) can access application logs`
            });
          }

          if (isArray(allowedUsers) && !isEmpty(allowedUsers) && allowedUsers.indexOf(profile.username) < 0) {
            return done(null, false, { message: `Only specified users can access application logs` });
          }

          return done(null, profile);
        });
    }
  ));

  const webPanel: Router = express.Router();

  webPanel.use(partials());
  webPanel.use(bodyParser.urlencoded({ extended: true }));
  webPanel.use(bodyParser.json());
  webPanel.use(methodOverride());
  webPanel.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  webPanel.use(passport.initialize());
  webPanel.use(passport.session());
  webPanel.use(flash());
  webPanel.use(express.static(__dirname + '/public'));
  webPanel.use(errorHandler);

  // var app = express();

  // // configure Express
  // app.set('views', __dirname + '/../../views');
  // app.set('view engine', 'ejs');
  // app.use(partials());
  // app.use(bodyParser.urlencoded({ extended: true }));
  // app.use(bodyParser.json());
  // app.use(methodOverride());
  // app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
  // // Initialize Passport!  Also use passport.session() middleware, to support
  // // persistent login sessions (recommended).
  // app.use(passport.initialize());
  // app.use(passport.session());
  // app.use(flash());
  // app.use(express.static(__dirname + '/public'));
  // app.use(errorHandler);


  webPanel.get('/', function (req, res) {
    res.render('index', { user: req.user });
  });

  webPanel.get('/account', ensureAuthenticated, function (req, res) {
    res.render('account', { user: req.user });
  });

  webPanel.get('/login', function (req, res) {
    const message = req.flash('error').map((msg) => marked(msg));
    res.render('login', { user: req.user, message: message });
  });

  // GET /auth/github
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in GitHub authentication will involve redirecting
  //   the user to github.com.  After authorization, GitHub will redirect the user
  //   back to this application at /auth/github/callback
  webPanel.get('/auth/github', passport.authenticate('github', { scope: [ 'user:email', 'read:org' ] }));

  // GET /auth/github/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function will be called,
  //   which, in this example, will redirect the user to the home page.
  webPanel.get('/auth/github/callback',
    passport.authenticate('github', {
      successRedirect: '/account',
      failureFlash: true,
      failureRedirect: '/login'
    }));

  webPanel.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  // app.listen(3000);

  return webPanel;


  // Simple route middleware to ensure user is authenticated.
  //   Use this route middleware on any resource that needs to be protected.  If
  //   the request is authenticated (typically via a persistent login session),
  //   the request will proceed.  Otherwise, the user will be redirected to the
  //   login page.
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
  }

  function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
  }

};
