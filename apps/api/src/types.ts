/**
 * Cloudflare Email Service (public beta) Workers binding.
 * `@cloudflare/workers-types` may not type this yet, so we model the subset we use.
 */
export interface SendEmailBinding {
  send(message: {
    to: Array<{ email: string; name?: string }>;
    from: { email: string; name?: string };
    subject: string;
    text?: string;
    html?: string;
    replyTo?: { email: string; name?: string };
    headers?: Record<string, string>;
  }): Promise<void>;
}

export interface Env {
  CONVEX_URL: string;
  DELULU_APP_URL?: string;
  DELULU_RATE_LIMIT_KV: KVNamespace;
  DELULU_SOCIAL_BUCKET: R2Bucket;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  SEND_EMAIL: SendEmailBinding;
  INTERNAL_NOTIFICATIONS_SECRET: string;
  NOTIFICATION_FROM_EMAIL: string;
  NOTIFICATION_FROM_NAME: string;
}

export interface ApiKeyData {
  userId: string;
  scopes: string[];
  planType: "FREE" | "ECHO" | "VIBE";
  apiKeyId: string;
  organizationId?: string;
}

export interface AppContext {
  env: Env;
  apiKey: ApiKeyData;
}
