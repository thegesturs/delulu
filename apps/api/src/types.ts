export interface Env {
  CONVEX_URL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
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
