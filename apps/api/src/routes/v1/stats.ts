import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Hono } from "hono";
import { createConvexClient } from "../../lib/convex-client";
import { requireScope } from "../../middleware/auth";
import type { ApiKeyData, Env } from "../../types";

interface StatsEnv {
  Bindings: Env;
  Variables: { apiKey: ApiKeyData };
}

const stats = new Hono<StatsEnv>();

// Get usage stats
stats.get("/usage", requireScope("stats:read"), async (c) => {
  const apiKey = c.get("apiKey");
  const convex = createConvexClient(c.env);
  const result = await convex.query(api.subscriptions.apiGetUsage, {
    userId: apiKey.userId as Id<"users">,
  });
  return c.json({ data: result });
});

// Get subscription info
stats.get("/subscription", requireScope("stats:read"), async (c) => {
  const apiKey = c.get("apiKey");
  const convex = createConvexClient(c.env);
  // biome-ignore lint/suspicious/noExplicitAny: Convex doc shape
  const result = (await convex.query(api.subscriptions.apiGetSubscription, {
    userId: apiKey.userId as Id<"users">,
  })) as any;

  if (!result) {
    return c.json({
      data: { planType: "FREE", status: "ACTIVE" },
    });
  }

  return c.json({
    data: {
      id: result._id,
      planType: result.planType,
      status: result.status,
      billingPeriod: result.billingPeriod,
      currentPeriodStart: result.currentPeriodStart,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    },
  });
});

export default stats;
