import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Hono } from "hono";
import { createConvexClient } from "../../lib/convex-client";
import { transformAccount } from "../../lib/transform";
import { requireScope } from "../../middleware/auth";
import type { ApiKeyData, Env } from "../../types";

interface AccountsEnv {
  Bindings: Env;
  Variables: { apiKey: ApiKeyData };
}

const accounts = new Hono<AccountsEnv>();

// List connected accounts
accounts.get("/", requireScope("accounts:read"), async (c) => {
  const apiKey = c.get("apiKey");
  const convex = createConvexClient(c.env);
  const result = await convex.query(
    api.social_providers.apiGetConnectedAccounts,
    {
      userId: apiKey.userId as Id<"users">,
      organizationId: apiKey.organizationId,
    }
  );

  return c.json({
    // biome-ignore lint/suspicious/noExplicitAny: Convex doc shape
    data: ((result as any[]) || []).map(transformAccount),
  });
});

// Get a single account
accounts.get("/:id", requireScope("accounts:read"), async (c) => {
  const apiKey = c.get("apiKey");
  const accountId = c.req.param("id");

  const convex = createConvexClient(c.env);
  const result = await convex.query(api.social_providers.apiGetAccountById, {
    userId: apiKey.userId as Id<"users">,
    accountId: accountId as Id<"socialProviders">,
    organizationId: apiKey.organizationId,
  });

  if (!result) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Account not found" } },
      404
    );
  }

  return c.json({ data: transformAccount(result) });
});

export default accounts;
