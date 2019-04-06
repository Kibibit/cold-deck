import bodyParser from 'body-parser';
import express, { Router } from 'express';
import partials from 'express-partials';
import session from 'express-session';
import methodOverride from 'method-override';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import flash from 'connect-flash';
import { isEmpty, isArray, compact } from 'lodash';
import marked from 'marked';
import Octokit from '@octokit/rest';
import path from 'path';
import fs from 'fs-extra';
import lowdb from 'lowdb';
import FileAsync from 'lowdb/adapters/FileAsync';
import moment from 'moment';
import { ColdDeck } from '../cold-deck';

interface KbUser {
  displayName: string;
  emails: string[];
  organizations: string[];
  username: string;
  avatar: string;
}

interface KbGithubClient {
  githubClientId: string;
  githubClientSecret: string;
  redirectUrl: string;
}

export function kbAuthenticatedRoute(coldDeck: ColdDeck, githubClient: KbGithubClient, allowedOrganization?: string, allowedUsers?: string[]): express.Express {
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

  const webPanel = express();

  webPanel.set('views', __dirname + '/../../views');
  webPanel.set('view engine', 'ejs');
  webPanel.set('view engine', 'html');
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
  webPanel.use(express.static(__dirname + '/../../public'));
  webPanel.use(coldDeck.expressLogger());
  webPanel.use(errorHandler);

  webPanel.get('/', ensureAuthenticated, function (req, res) {
    // res.render('index.', { user: req.user });
    res.sendFile(path.join(__dirname + '/../../public/kb-cd-ui/index.html'));
  });

  webPanel.get('/user', ensureAuthenticated, function (req, res) {
    const user: KbUser = {
      displayName: req.user.displayName,
      emails: req.user.emails.map((emailObj) => emailObj.value),
      organizations: req.user.organizations,
      username: req.user.username,
      avatar: req.user.photos[ 0 ].value
    };
    res.json(user);
  });

  webPanel.get('/login', function (req, res) {
    const message = req.flash('error').map((msg) => marked(msg));
    res.render('login.ejs', { user: req.user, message: message });
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
      successRedirect: '../../',
      failureFlash: true,
      failureRedirect: '../../login'
    }));

  webPanel.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  webPanel.get('/logs', function (req, res, next) {
    const day = moment.utc().format('YYYY-MM-DD');
    const adapter = new FileAsync(process.cwd() + `/logs/${ day }.json`);

    fs.ensureFile(process.cwd() + `/logs/${ day }.json`)
      .then(() => lowdb(adapter))
      .then((db) => {
        // send this day's database
        const todaysLogs = db.getState();

        res.json(todaysLogs);

        // we later need to also open a web-socket channel to update for changes in today's logs' wdb
      })
      .catch((err) => next(err));
    // fs.readFile(process.cwd() + '/logs/combined.log', 'utf8', (err, fileContent) => {
    //   if (err) { return next(err); }

    //   try {
    //     const logs = compact(fileContent.split('\n')).map((json) => JSON.parse(json));
    //     res.json({ logs });
    //   } catch (err) {
    //     next(err);
    //   }
    // });
  });

  webPanel.get('*', function (req, res) {
    res.status(404);
    res.render('error.ejs', { error: `the page you are looking for can't be found`, statusCode: 404 });
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
    res.redirect('./login');
  }

  function errorHandler(err, req, res, next) {
    res.status(500);
    res.render('error.ejs', { error: err, statusCode: 500 });
  }

};
