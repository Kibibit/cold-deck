import { kbAuthenticatedRoute } from './kb-authenticated-route';
import { kbUnAuthenticatedRoute } from './kb-unauthenticated-route';
import { ColdDeck } from '../cold-deck';

export interface KbMiddlewareOptions {
  githubClient?: {
    githubClientId: string;
    githubClientSecret: string;
    redirectUrl: string;
  }
}

export function kbMiddleware(coldDeck: ColdDeck, options: KbMiddlewareOptions, allowedOrganization?: string, allowedUsers?: string[]) {
  if (options.githubClient) {
    return kbAuthenticatedRoute(coldDeck, options.githubClient, allowedOrganization, allowedUsers);
  }

  return kbUnAuthenticatedRoute(coldDeck);
};
