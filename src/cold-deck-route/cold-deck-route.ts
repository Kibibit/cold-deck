import { kbAuthenticatedRoute } from './kb-authenticated-route';
import { kbUnAuthenticatedRoute } from './kb-unauthenticated-route';

interface KbMiddlewareOptions {
  githubClient?: {
    githubClientId: string;
    githubClientSecret: string;
    redirectUrl: string;
  }
}
// EXAMPLE
// import express = require('express');
//
// const githubClientId = 'CLIENT_ID';
// const githubClientSecret = 'CLIENT_SECRET';
// const redirectUrl = 'REDIRECT_URL';

// const githubClient = { githubClientId, githubClientSecret, redirectUrl };

// const app = express();

// app.use('/logs', kbMiddleware({ githubClient }, 'kibibit'));

// app.listen(3000);

export function kbMiddleware(options: KbMiddlewareOptions, allowedOrganization?: string, allowedUsers?: string[]) {
  if (options.githubClient) {
    return kbAuthenticatedRoute(options.githubClient, allowedOrganization, allowedUsers);
  }

  return kbUnAuthenticatedRoute();
};
