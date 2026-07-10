import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Hono } from "hono";
import { createConvexClient } from "../../lib/convex-client";
import { transformPost } from "../../lib/transform";
import { requireScope } from "../../middleware/auth";
import type { ApiKeyData, Env } from "../../types";

interface PostsEnv {
  Bindings: Env;
  Variables: { apiKey: ApiKeyData };
}

const posts = new Hono<PostsEnv>();

// biome-ignore lint/suspicious/noExplicitAny: API input is untyped
type AnyInput = Record<string, any>;

/**
 * Convert external API input fields to internal Convex format.
 * caption (string) → content (blocks array)
 * account_ids → socialProviderIds
 * account_overrides → alternativeContent
 * account_settings → providerSettings
 */
function toInternalInput(body: AnyInput) {
  const internal: AnyInput = {};

  if (body.status !== undefined) {
    internal.status = body.status;
  }

  // caption + media → content blocks
  if (body.caption !== undefined || body.media !== undefined) {
    internal.content = [
      {
        order: 0,
        name: "paragraph",
        text: body.caption || "",
        media: (body.media || []).map((m: AnyInput) => ({
          url: m.url,
          type: m.type,
          ...(m.alt_text ? { altText: m.alt_text } : {}),
        })),
      },
    ];
  }

  if (body.account_ids !== undefined) {
    internal.socialProviderIds = body.account_ids;
  }

  if (body.account_overrides !== undefined) {
    internal.alternativeContent = body.account_overrides.map(
      (override: AnyInput) => ({
        socialProviderId: override.account_id,
        content: [
          {
            order: 0,
            name: "paragraph",
            text: override.caption || "",
            media: (override.media || []).map((m: AnyInput) => ({
              url: m.url,
              type: m.type,
              ...(m.alt_text ? { altText: m.alt_text } : {}),
            })),
          },
        ],
      })
    );
  }

  if (body.account_settings !== undefined) {
    internal.providerSettings = body.account_settings.map((ps: AnyInput) => ({
      socialProviderId: ps.account_id,
      type: ps.type,
      settings: ps.settings,
    }));
  }

  if (body.scheduled_at !== undefined) {
    internal.scheduledAt = body.scheduled_at;
  }

  if (body.privacy_status !== undefined) {
    internal.privacyStatus = body.privacy_status;
  }

  return internal;
}

// List posts
posts.get("/", requireScope("posts:read"), async (c) => {
  const apiKey = c.get("apiKey");
  const status = c.req.query("status");
  const cursor = c.req.query("cursor") || null;
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);

  const convex = createConvexClient(c.env);
  const result = (await convex.query(api.posts.apiGetPosts, {
    userId: apiKey.userId as Id<"users">,
    status: (status || undefined) as
      | "SAVED"
      | "PUBLISHED"
      | "SCHEDULED"
      | "DELETED"
      | "FAILED"
      | "PROCESSING"
      | undefined,
    isDeleted: false,
    paginationOpts: { numItems: limit, cursor },
    // biome-ignore lint/suspicious/noExplicitAny: Convex pagination response
  })) as any;

  return c.json({
    data: result.page?.map(transformPost) || [],
    pagination: {
      cursor: result.continueCursor || null,
      hasMore: !result.isDone,
    },
  });
});

// Get a single post
posts.get("/:id", requireScope("posts:read"), async (c) => {
  const apiKey = c.get("apiKey");
  const postId = c.req.param("id");

  const convex = createConvexClient(c.env);
  const result = await convex.query(api.posts.apiGetPostById, {
    userId: apiKey.userId as Id<"users">,
    postId: postId as Id<"posts">,
  });

  if (!result) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Post not found" } },
      404
    );
  }

  return c.json({ data: transformPost(result) });
});

// Create a post
posts.post("/", requireScope("posts:write"), async (c) => {
  const apiKey = c.get("apiKey");
  const body = await c.req.json();
  const internal = toInternalInput(body);

  const convex = createConvexClient(c.env);

  // Org-scoped API key: create post with review flow (atomic)
  if (apiKey.organizationId) {
    const result = await convex.mutation(api.posts.apiCreatePostWithReview, {
      userId: apiKey.userId as Id<"users">,
      organizationId: apiKey.organizationId,
      content: internal.content,
      socialProviderIds: internal.socialProviderIds || [],
      alternativeContent: internal.alternativeContent,
      scheduledAt: internal.scheduledAt,
      providerSettings: internal.providerSettings,
      privacyStatus: internal.privacyStatus,
      externalSubmissionId: body.external_submission_id,
    });

    const appUrl = c.env.DELULU_APP_URL || "https://solulu.delulu.social";
    return c.json(
      {
        data: {
          id: result.postId,
          review_status: result.reviewStatus,
          review_url: `${appUrl}/review/${result.postId}`,
        },
      },
      201
    );
  }

  // Personal API key: create post without review flow (existing behavior)
  const result = await convex.mutation(api.posts.apiCreatePost, {
    userId: apiKey.userId as Id<"users">,
    status: (internal.status || "SAVED") as "SAVED" | "PUBLISHED" | "SCHEDULED",
    content: internal.content,
    socialProviderIds: internal.socialProviderIds || [],
    alternativeContent: internal.alternativeContent,
    scheduledAt: internal.scheduledAt,
    providerSettings: internal.providerSettings,
  });

  return c.json({ data: { id: result } }, 201);
});

// Get review status for a post
posts.get("/:id/review", requireScope("reviews:read"), async (c) => {
  const apiKey = c.get("apiKey");
  const postId = c.req.param("id");

  const convex = createConvexClient(c.env);
  const result = await convex.query(api.post_reviews.apiGetReviewForPost, {
    userId: apiKey.userId as Id<"users">,
    postId: postId as Id<"posts">,
  });

  if (!result) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Review not found" } },
      404
    );
  }

  return c.json({ data: result });
});

// Update a post
posts.patch("/:id", requireScope("posts:write"), async (c) => {
  const apiKey = c.get("apiKey");
  const postId = c.req.param("id");
  const body = await c.req.json();
  const internal = toInternalInput(body);

  const convex = createConvexClient(c.env);
  await convex.mutation(api.posts.apiUpdatePost, {
    userId: apiKey.userId as Id<"users">,
    postId: postId as Id<"posts">,
    ...internal,
  });

  return c.json({ data: { success: true } });
});

// Delete a post
posts.delete("/:id", requireScope("posts:write"), async (c) => {
  const apiKey = c.get("apiKey");
  const postId = c.req.param("id");

  const convex = createConvexClient(c.env);
  await convex.mutation(api.posts.apiSoftDeletePost, {
    userId: apiKey.userId as Id<"users">,
    postId: postId as Id<"posts">,
  });

  return c.json({ data: { success: true } });
});

export default posts;
