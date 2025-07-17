// Cloudflare Environment Variables Type Definition
// This file contains the CloudflareEnv interface for type-safe environment access
// Auto-generated from wrangler types - DO NOT EDIT MANUALLY

import type { Fetcher, KVNamespace } from '@cloudflare/workers-types';

export interface CloudflareEnv {
  DELULU_FACEBOOK_PAGES: KVNamespace;
  NEXTJS_ENV: string;
  RESEND_FROM: string;
  RESEND_TOKEN: string;
  BETTER_AUTH_SECRET: string;
  DATABASE_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_WEB_URL: string;
  NEXT_PUBLIC_DOCS_URL: string;
  NEXT_PUBLIC_POSTHOG_KEY: string;
  NEXT_PUBLIC_POSTHOG_HOST: string;
  SVIX_TOKEN: string;
  TWITTER_CLIENT_ID: string;
  TWITTER_CLIENT_SECRET: string;
  TWITTER_CALLBACK_URL: string;
  TWITTER_STATE: string;
  LINKEDIN_CLIENT_ID: string;
  LINKEDIN_CLIENT_SECRET: string;
  LINKEDIN_CALLBACK_URL: string;
  TIKTOK_CLIENT_ID: string;
  TIKTOK_CLIENT_SECRET: string;
  TIKTOK_CALLBACK_URL: string;
  INSTAGRAM_CLIENT_ID: string;
  INSTAGRAM_CLIENT_SECRET: string;
  INSTAGRAM_CALLBACK_URL: string;
  FACEBOOK_CLIENT_ID: string;
  FACEBOOK_CLIENT_SECRET: string;
  FACEBOOK_CALLBACK_URL: string;
  PINTEREST_CLIENT_ID: string;
  PINTEREST_CLIENT_SECRET: string;
  PINTEREST_CALLBACK_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  YOUTUBE_CALLBACK_URL: string;
  THREADS_CLIENT_ID: string;
  THREADS_CLIENT_SECRET: string;
  THREADS_CALLBACK_URL: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_TOKEN: string;
  R2_BUCKET_NAME: string;
  R2_ENDPOINT: string;
  FARCASTER_APP_FID: string;
  WORKER_SELF_REFERENCE: Fetcher /* delulu-social */;
  ASSETS: Fetcher;
}
