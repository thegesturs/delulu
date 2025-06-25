import { facebookProvider } from './facebook.provider';
import { farcasterProvider } from './farcaster.provider';
import { instagramProvider } from './instagram.provider';
import { linkedinProvider } from './linkedin.provider';
import { pinterestProvider } from './pinterest.provider';
import { threadsProvider } from './threads.provider';
import { tiktokProvider } from './tiktok.provider';
import { twitterProvider } from './twitter.provider';
import { youtubeProvider } from './youtube.provider';

export const providerRegistry = {
  TWITTER: twitterProvider,
  LINKEDIN: linkedinProvider,
  TIKTOK: tiktokProvider,
  INSTAGRAM: instagramProvider,
  THREADS: threadsProvider,
  FACEBOOK: facebookProvider,
  PINTEREST: pinterestProvider,
  FARCASTER: farcasterProvider,
  YOUTUBE: youtubeProvider,
};
