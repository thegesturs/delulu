import { createMiddleware } from "hono/factory";
import type { ApiKeyData, Env } from "../types";

interface RateLimitEnv {
  Bindings: Env;
  Variables: {
    apiKey: ApiKeyData;
  };
}

const RATE_LIMITS: Record<string, { perMinute: number; perDay: number }> = {
  FREE: { perMinute: 20, perDay: 500 },
  ECHO: { perMinute: 60, perDay: 5000 },
  VIBE: { perMinute: 120, perDay: 20_000 },
};

export const rateLimitMiddleware = createMiddleware<RateLimitEnv>(
  async (c, next) => {
    const apiKey = c.get("apiKey");
    const limits = RATE_LIMITS[apiKey.planType] || RATE_LIMITS.FREE;

    const windowTs = Math.floor(Date.now() / 60_000);
    const key = `min:${apiKey.apiKeyId}:${windowTs}`;
    const kv = c.env.RATE_LIMIT_KV;

    const current = Number.parseInt((await kv.get(key)) || "0", 10);
    const limit = limits.perMinute;
    const reset = (windowTs + 1) * 60_000;
    const remaining = Math.max(0, limit - current - 1);

    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", reset.toString());

    if (current >= limit) {
      c.header("X-RateLimit-Remaining", "0");
      return c.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        },
        429
      );
    }

    await kv.put(key, (current + 1).toString(), { expirationTtl: 60 });

    await next();
  }
);
