import { instagramProvider } from './instagram.provider';
import { linkedinProvider } from './linkedin.provider';
import { tiktokProvider } from './tiktok.provider';
import { twitterProvider } from './twitter.provider';

export const providerRegistry = {
  TWITTER: twitterProvider,
  LINKEDIN: linkedinProvider,
  TIKTOK: tiktokProvider,
  INSTAGRAM: instagramProvider,
};
