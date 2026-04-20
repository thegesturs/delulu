import { createMiddleware } from "hono/factory";
import type { Env } from "../types";

interface InternalEnv {
  Bindings: Env;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: constant-time comparison requires bitwise ops
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Service-to-service auth for the /v1/notifications/* subtree.
 * The public API-key middleware doesn't apply here; instead, callers
 * (Convex actions) send a shared secret in `X-Internal-Secret`.
 */
export const internalSecretMiddleware = createMiddleware<InternalEnv>(
  async (c, next) => {
    const got = c.req.header("X-Internal-Secret");
    const want = c.env.INTERNAL_NOTIFICATIONS_SECRET;
    if (!(got && want && constantTimeEquals(got, want))) {
      return c.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing internal secret",
          },
        },
        401
      );
    }
    await next();
  }
);
