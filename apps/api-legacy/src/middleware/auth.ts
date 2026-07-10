import { createClerkClient } from "@clerk/backend";
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

const OAUTH_SCOPES = [
  "posts:read",
  "posts:write",
  "accounts:read",
  "stats:read",
  "media:write",
  "reviews:read",
];

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");
  if (!payload) {
    return {};
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function authenticateApiKey(c: Parameters<typeof authMiddleware>[0]) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return null;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const convex = createConvexClient(c.env);
  const result = await convex.query(api.api_keys.validateApiKey, { keyHash });

  if (!result) {
    return null;
  }

  convex
    .mutation(api.api_keys.updateLastUsed, {
      keyId: (result as ApiKeyData).apiKeyId as Id<"apiKeys">,
    })
    .catch(() => {
      console.error("Failed to update last used API key");
    });

  return { ...(result as ApiKeyData), authType: "api_key" as const };
}

async function authenticateOAuthToken(c: Parameters<typeof authMiddleware>[0]) {
  if (!(c.env.CLERK_SECRET_KEY && c.env.CLERK_PUBLISHABLE_KEY)) {
    return null;
  }

  const clerk = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
  });

  const requestState = await clerk.authenticateRequest(c.req.raw, {
    acceptsToken: "oauth_token",
  });

  if (!requestState.isAuthenticated) {
    return null;
  }

  const auth = requestState.toAuth();
  if (auth.tokenType !== "oauth_token" || !auth.userId) {
    return null;
  }

  const tokenPayload = decodeJwtPayload(requestState.token);
  const organizationId =
    typeof tokenPayload.org_id === "string" ? tokenPayload.org_id : undefined;

  const convex = createConvexClient(c.env);
  const authContext = await convex.query(api.api_keys.resolveOAuthSubject, {
    externalId: auth.userId,
    organizationId,
  });

  if (!authContext) {
    return null;
  }

  return {
    userId: authContext.userId,
    scopes: OAUTH_SCOPES,
    planType: authContext.planType,
    apiKeyId: `oauth:${auth.clientId || auth.id}`,
    organizationId: authContext.organizationId,
    authType: "oauth_token" as const,
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

  const authContext =
    (await authenticateApiKey(c)) || (await authenticateOAuthToken(c));

  if (!authContext) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      401
    );
  }

  c.set("apiKey", authContext);
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
