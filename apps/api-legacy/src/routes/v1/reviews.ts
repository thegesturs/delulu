import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Hono } from "hono";
import { createConvexClient } from "../../lib/convex-client";
import { requireScope } from "../../middleware/auth";
import type { ApiKeyData, Env } from "../../types";

interface ReviewsEnv {
  Bindings: Env;
  Variables: { apiKey: ApiKeyData };
}

const reviews = new Hono<ReviewsEnv>();

// List reviews for the org (org-scoped API keys only)
reviews.get("/", requireScope("reviews:read"), async (c) => {
  const apiKey = c.get("apiKey");

  if (!apiKey.organizationId) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "This endpoint requires an org-scoped API key",
        },
      },
      400
    );
  }

  const status = c.req.query("status") as
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | undefined;

  const convex = createConvexClient(c.env);
  const result = await convex.query(api.post_reviews.apiGetReviewsByOrg, {
    userId: apiKey.userId as Id<"users">,
    organizationId: apiKey.organizationId,
    status: status || undefined,
  });

  return c.json({ data: result });
});

export default reviews;
