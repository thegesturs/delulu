import { linkedinProvider } from './linkedin.provider';
import { twitterProvider } from './twitter';

export const providerRegistry = {
  TWITTER: twitterProvider,
  LINKEDIN: linkedinProvider,
};
