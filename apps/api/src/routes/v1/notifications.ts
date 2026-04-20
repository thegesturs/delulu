import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import { Hono } from "hono";
import { createConvexClient } from "../../lib/convex-client";
import {
  sendPublishFailedEmail,
  sendReviewRequestedEmail,
  sendWelcomeEmail,
} from "../../lib/notifications";
import { internalSecretMiddleware } from "../../middleware/internal-auth";
import type { Env } from "../../types";

interface NotificationsEnv {
  Bindings: Env;
}

const notifications = new Hono<NotificationsEnv>();

notifications.use("*", internalSecretMiddleware);

notifications.post("/post-review-requested", async (c) => {
  const body = (await c.req.json()) as { postId?: string };
  const postId = body.postId;
  if (!postId) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Missing postId" } },
      400
    );
  }

  const convex = createConvexClient(c.env);
  const hydrated = await convex.query(api.post_reviews.apiGetReviewersForPost, {
    postId: postId as Id<"posts">,
  });

  if (!hydrated) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Post or review not found",
        },
      },
      404
    );
  }

  const result = await sendReviewRequestedEmail(c.env, {
    recipients: hydrated.reviewers.map((r) => ({
      email: r.email,
      name: r.name,
    })),
    submitterName: hydrated.submitterName,
    postPreview: hydrated.postPreview,
    postId,
  });

  return c.json(result);
});

notifications.post("/post-publish-failed", async (c) => {
  const body = (await c.req.json()) as { postId?: string };
  const postId = body.postId;
  if (!postId) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Missing postId" } },
      400
    );
  }

  const convex = createConvexClient(c.env);
  const hydrated = await convex.query(
    api.posts.apiGetPostForFailureNotification,
    { postId: postId as Id<"posts"> }
  );

  if (!hydrated) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Post not found" } },
      404
    );
  }

  const result = await sendPublishFailedEmail(c.env, {
    recipient: { email: hydrated.authorEmail, name: hydrated.authorName },
    postPreview: hydrated.postPreview,
    failureReason: hydrated.failureReason,
    postId,
  });

  return c.json(result);
});

notifications.post("/welcome", async (c) => {
  const body = (await c.req.json()) as { clerkUserId?: string };
  const clerkUserId = body.clerkUserId;
  if (!clerkUserId) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Missing clerkUserId" } },
      400
    );
  }

  const convex = createConvexClient(c.env);
  const hydrated = await convex.mutation(api.users.apiClaimWelcomeSend, {
    clerkUserId,
  });

  if (!hydrated) {
    // Already sent or user not found — 200 OK (idempotent no-op).
    return c.json({ ok: true, skipped: true });
  }

  const result = await sendWelcomeEmail(c.env, {
    recipient: { email: hydrated.email, name: hydrated.name },
    name: hydrated.name,
  });

  return c.json(result);
});

export default notifications;
