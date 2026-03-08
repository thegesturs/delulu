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

  const convex = createConvexClient(c.env);
  const result = await convex.mutation(api.posts.apiCreatePost, {
    userId: apiKey.userId as Id<"users">,
    status: (body.status || "SAVED") as "SAVED" | "PUBLISHED" | "SCHEDULED",
    content: body.content,
    socialProviderIds: body.socialProviderIds || [],
    alternativeContent: body.alternativeContent,
    scheduledAt: body.scheduledAt,
    reviewStatus: body.reviewStatus,
    privacyStatus: body.privacyStatus,
    providerSettings: body.providerSettings,
  });

  return c.json({ data: { id: result } }, 201);
});

// Update a post
posts.patch("/:id", requireScope("posts:write"), async (c) => {
  const apiKey = c.get("apiKey");
  const postId = c.req.param("id");
  const body = await c.req.json();

  const convex = createConvexClient(c.env);
  await convex.mutation(api.posts.apiUpdatePost, {
    userId: apiKey.userId as Id<"users">,
    postId: postId as Id<"posts">,
    ...body,
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
