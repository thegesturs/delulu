import { linkedinProvider } from './linkedin.provider';
import { twitterProvider } from './twitter.provider';

export const providerRegistry = {
  TWITTER: twitterProvider,
  LINKEDIN: linkedinProvider,
};
