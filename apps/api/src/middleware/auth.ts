import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { createMiddleware } from "hono/factory";
import { createConvexClient } from "../lib/convex-client";
import type { ApiKeyData, Env } from "../types";

interface AuthEnv {
  Bindings: Env;
  Variables: {
    apiKey: ApiKeyData;
  };
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header",
        },
      },
      401
    );
  }

  const token = authHeader.slice(7);
  if (!token) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Missing API key" } },
      401
    );
  }

  // Hash the token with SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Validate against Convex
  const convex = createConvexClient(c.env);
  const result = await convex.query(api.api_keys.validateApiKey, { keyHash });

  if (!result) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired API key",
        },
      },
      401
    );
  }

  c.set("apiKey", result as ApiKeyData);

  // Update last used (fire and forget)
  convex
    .mutation(api.api_keys.updateLastUsed, {
      keyId: (result as ApiKeyData).apiKeyId as Id<"apiKeys">,
    })
    .catch(() => {});

  await next();
});

export function requireScope(scope: string) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const apiKey = c.get("apiKey");
    if (!apiKey.scopes.includes(scope)) {
      return c.json(
        {
          error: {
            code: "FORBIDDEN",
            message: `Missing required scope: ${scope}`,
          },
        },
        403
      );
    }
    await next();
  });
}
