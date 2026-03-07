export interface Env {
  CONVEX_URL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  DELULU_SOCIAL_BUCKET: R2Bucket;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}

export interface ApiKeyData {
  userId: string;
  scopes: string[];
  planType: "FREE" | "ECHO" | "VIBE";
  apiKeyId: string;
}

export interface AppContext {
  env: Env;
  apiKey: ApiKeyData;
}
