import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
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

    const redis = new Redis({
      url: c.env.UPSTASH_REDIS_REST_URL,
      token: c.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const minuteLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits.perMinute, "1 m"),
      prefix: "api:rate:min",
    });

    const identifier = apiKey.apiKeyId;
    const { success, limit, remaining, reset } =
      await minuteLimiter.limit(identifier);

    c.header("X-RateLimit-Limit", limit.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", reset.toString());

    if (!success) {
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

    await next();
  }
);
