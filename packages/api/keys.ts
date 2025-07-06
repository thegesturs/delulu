import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      TWITTER_CLIENT_SECRET: z.string().min(1),
      TWITTER_CLIENT_ID: z.string().min(1),
      TWITTER_CALLBACK_URL: z.string().min(1),
      TWITTER_STATE: z.string().min(1),

      LINKEDIN_CLIENT_ID: z.string().min(1),
      LINKEDIN_CLIENT_SECRET: z.string().min(1),
      LINKEDIN_CALLBACK_URL: z.string().min(1),

      INSTAGRAM_CLIENT_ID: z.string().min(1),
      INSTAGRAM_CLIENT_SECRET: z.string().min(1),
      INSTAGRAM_CALLBACK_URL: z.string().min(1),

      THREADS_CLIENT_ID: z.string().min(1),
      THREADS_CLIENT_SECRET: z.string().min(1),
      THREADS_CALLBACK_URL: z.string().min(1),

      FARCASTER_APP_FID: z.string().min(1),
      FARCASTER_MNEMONIC: z.string().min(1).optional(), // For proper signer generation

      FACEBOOK_CLIENT_ID: z.string().min(1),
      FACEBOOK_CLIENT_SECRET: z.string().min(1),
      FACEBOOK_CALLBACK_URL: z.string().min(1),

      PINTEREST_CLIENT_ID: z.string().min(1),
      PINTEREST_CLIENT_SECRET: z.string().min(1),
      PINTEREST_CALLBACK_URL: z.string().min(1),

      GOOGLE_CLIENT_ID: z.string().min(1),
      GOOGLE_CLIENT_SECRET: z.string().min(1),
      YOUTUBE_CALLBACK_URL: z.string().min(1),

      REDIS_URL: z.string().min(1),
      R2_ACCESS_KEY_ID: z.string().min(1),
      R2_SECRET_ACCESS_KEY: z.string().min(1),
      R2_BUCKET_NAME: z.string().min(1),
      R2_ACCOUNT_ID: z.string().min(1),
      TIKTOK_CLIENT_ID: z.string().min(1),
      TIKTOK_CLIENT_SECRET: z.string().min(1),
      TIKTOK_CALLBACK_URL: z.string().min(1),

      POSTING_SECRET_KEY: z.string().min(1),
    },
    runtimeEnv: {
      TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
      TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
      INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
      INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
      INSTAGRAM_CALLBACK_URL: process.env.INSTAGRAM_CALLBACK_URL,
      LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
      LINKEDIN_CALLBACK_URL: process.env.LINKEDIN_CALLBACK_URL,
      TWITTER_CALLBACK_URL: process.env.TWITTER_CALLBACK_URL,
      TWITTER_STATE: process.env.TWITTER_STATE,
      REDIS_URL: process.env.REDIS_URL,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
      TIKTOK_CLIENT_ID: process.env.TIKTOK_CLIENT_ID,
      TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET,
      TIKTOK_CALLBACK_URL: process.env.TIKTOK_CALLBACK_URL,
      THREADS_CLIENT_ID: process.env.THREADS_CLIENT_ID,
      THREADS_CLIENT_SECRET: process.env.THREADS_CLIENT_SECRET,
      THREADS_CALLBACK_URL: process.env.THREADS_CALLBACK_URL,

      FARCASTER_APP_FID: process.env.FARCASTER_APP_FID,
      FARCASTER_MNEMONIC: process.env.FARCASTER_MNEMONIC,

      FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
      FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
      FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,

      PINTEREST_CLIENT_ID: process.env.PINTEREST_CLIENT_ID,
      PINTEREST_CLIENT_SECRET: process.env.PINTEREST_CLIENT_SECRET,
      PINTEREST_CALLBACK_URL: process.env.PINTEREST_CALLBACK_URL,

      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      YOUTUBE_CALLBACK_URL: process.env.YOUTUBE_CALLBACK_URL,

      POSTING_SECRET_KEY: process.env.POSTING_SECRET_KEY,
    },
  });
