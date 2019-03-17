import { kbAuthenticatedRoute } from './kb-authenticated-route';
import express = require('express');
import { kbUnAuthenticatedRoute } from './kb-unauthenticated-route';

interface KbMiddlewareOptions {
  githubClient?: {
    githubClientId: string;
    githubClientSecret: string;
    redirectUrl: string;
  }
}

const githubClientId = 'EXAMPLE_CLIENT_ID';
const githubClientSecret = 'EXAMPLE_CLIENT_SECRET';
const redirectUrl = 'http://127.0.0.1:3000/logs/auth/github/callback';

const githubClient = { githubClientId, githubClientSecret, redirectUrl };

// const app = express();

// // configure Express
// app.set('views', __dirname + '/../../views');
// app.set('view engine', 'ejs');

// app.use('/logs', kbMiddleware({ githubClient }, 'kibibit'));

// app.listen(3000);

export function kbMiddleware(options: KbMiddlewareOptions, allowedOrganization?: string, allowedUsers?: string[]) {
  if (options.githubClient) {
    return kbAuthenticatedRoute(options.githubClient, allowedOrganization, allowedUsers);
  }

  return kbUnAuthenticatedRoute();
};
