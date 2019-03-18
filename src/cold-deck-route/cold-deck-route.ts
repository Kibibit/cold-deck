import { kbAuthenticatedRoute } from './kb-authenticated-route';
import { kbUnAuthenticatedRoute } from './kb-unauthenticated-route';

interface KbMiddlewareOptions {
  githubClient?: {
    githubClientId: string;
    githubClientSecret: string;
    redirectUrl: string;
  }
}

export function kbMiddleware(options: KbMiddlewareOptions, allowedOrganization?: string, allowedUsers?: string[]) {
  if (options.githubClient) {
    return kbAuthenticatedRoute(options.githubClient, allowedOrganization, allowedUsers);
  }

  return kbUnAuthenticatedRoute();
};
