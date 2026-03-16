import type { WebhookEvent } from "@clerk/backend";
import {
  ALL_SORTED_PRODUCT_IDS,
  ALL_TRY_DELULU_PRODUCT_IDS,
} from "@delulu/payments/product-ids";
import { createDodoWebhookHandler } from "@dodopayments/convex";
import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * Type for CallMeLater publish post request body
 */
interface PublishPostRequestBody {
  postId: string;
}

/**
 * HTTP endpoint to receive scheduled post publishing requests from CallMeLater
 * This endpoint is called by CallMeLater at the scheduled time
 */
http.route({
  path: "/publishPost",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = (await request.json()) as PublishPostRequestBody;
      const { postId } = body;

      if (!postId) {
        return new Response(
          JSON.stringify({ error: "Missing postId in request body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Call the existing internal action to publish the post
      await ctx.runAction(internal.posts.publishScheduledPost, {
        postId: postId as Id<"posts">,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in publishPost HTTP endpoint:", error);

      return new Response(
        JSON.stringify({
          error: "Failed to publish post",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint to receive scheduled video media cleanup requests from CallMeLater
 * Called 7 days after a post is published to clean up R2 video files
 */
http.route({
  path: "/deleteVideoMedia",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = (await request.json()) as { bucketKeys?: string[] };
      const { bucketKeys } = body;

      if (!bucketKeys || bucketKeys.length === 0) {
        return new Response(
          JSON.stringify({ error: "Missing bucketKeys in request body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      await ctx.runAction(internal.mediaCleanup.deleteVideosFromR2, {
        bucketKeys,
      });

      return new Response(
        JSON.stringify({ success: true, deleted: bucketKeys.length }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in deleteVideoMedia HTTP endpoint:", error);

      return new Response(
        JSON.stringify({
          error: "Failed to delete video media",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

/**
 * HTTP endpoint to execute delayed DMs from CallMeLater callbacks.
 * Called when a delay step timer expires.
 */
http.route({
  path: "/executeDelayedDm",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = (await request.json()) as {
        automationId?: string;
        sessionId?: string;
        instagramUserId?: string;
        instagramAccountId?: string;
        resumeFromStepId?: string;
        variables?: unknown;
      };

      if (
        !(
          body.automationId &&
          body.sessionId &&
          body.instagramUserId &&
          body.instagramAccountId &&
          body.resumeFromStepId
        )
      ) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      await ctx.runAction(internal.scheduledDms.executeDelayedDmAction, {
        automationId: body.automationId as Id<"automations">,
        sessionId: body.sessionId as Id<"automationSessions">,
        instagramUserId: body.instagramUserId,
        instagramAccountId: body.instagramAccountId,
        resumeFromStepId: body.resumeFromStepId,
        variables: body.variables,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in executeDelayedDm HTTP endpoint:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to execute delayed DM",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response("Error occurred", { status: 400 });
    }

    switch (event.type) {
      case "user.created": // intentional fallthrough
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "user.deleted": {
        const clerkUserId = event.data.id!;
        await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId });
        break;
      }

      default:
      // Ignore unhandled webhook events
    }

    return new Response(null, { status: 200 });
  }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
  const payloadString = await req.text();
  const svixHeaders = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  try {
    return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
  } catch {
    // Webhook validation failed - return null to trigger 400 response
    return null;
  }
}

/**
 * Dodo Payments Webhook Handler
 * Handles events from Dodo Payments for subscriptions and payments
 */
http.route({
  path: "/dodo-webhook",
  method: "POST",
  handler: createDodoWebhookHandler({
    // Handle successful payments
    onPaymentSucceeded: async (ctx, payload) => {
      console.log("[Dodo Webhook] Payment succeeded:", payload.data.payment_id);

      // Skip webhook if no subscription_id (one-off payment)
      if (!payload.data.subscription_id) {
        console.log(
          "[Dodo Webhook] Skipping payment without subscription_id (one-off charge)"
        );
        return;
      }

      await ctx.runMutation(internal.webhooks.handlePaymentSucceeded, {
        paymentId: payload.data.payment_id,
        businessId: payload.business_id,
        customerEmail: payload.data.customer?.email || "",
        customerId: payload.data.customer.customer_id,
        amount: payload.data.total_amount,
        currency: payload.data.currency,
        status: payload.data.status ?? "pending",
        subscriptionId: payload.data.subscription_id,
        productId: payload.data.product_cart?.[0]?.product_id ?? "",
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription activation
    onSubscriptionActive: async (ctx, payload) => {
      console.log(
        "[Dodo Webhook] Subscription activated:",
        payload.data.subscription_id
      );

      // Check if this is a Sorted extension metered subscription
      if (
        ALL_SORTED_PRODUCT_IDS.includes(
          payload.data.product_id as (typeof ALL_SORTED_PRODUCT_IDS)[number]
        )
      ) {
        console.log(
          "[Dodo Webhook] Sorted extension subscription — creating addon subscription record"
        );

        // Calculate period dates (same logic as regular subscriptions below)
        let sortedPeriodStart = Date.now();
        if (payload.data.previous_billing_date) {
          sortedPeriodStart = new Date(
            payload.data.previous_billing_date
          ).getTime();
        } else if (payload.data.created_at) {
          sortedPeriodStart = new Date(payload.data.created_at).getTime();
        }
        const sortedPeriodEnd = payload.data.next_billing_date
          ? new Date(payload.data.next_billing_date).getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000;

        await ctx.runMutation(internal.webhooks.handleSortedSubscription, {
          customerEmail: payload.data.customer?.email || "",
          customerId: payload.data.customer.customer_id,
          subscriptionId: payload.data.subscription_id,
          productId: payload.data.product_id,
          currentPeriodStart: sortedPeriodStart,
          currentPeriodEnd: sortedPeriodEnd,
        });
        return;
      }

      // Check if this is a Try Delulu subscription
      if (
        ALL_TRY_DELULU_PRODUCT_IDS.includes(
          payload.data.product_id as (typeof ALL_TRY_DELULU_PRODUCT_IDS)[number]
        )
      ) {
        console.log(
          "[Dodo Webhook] Try Delulu subscription — delegating to tryDelulu handler"
        );

        let tryDeluluPeriodStart = Date.now();
        if (payload.data.previous_billing_date) {
          tryDeluluPeriodStart = new Date(
            payload.data.previous_billing_date
          ).getTime();
        } else if (payload.data.created_at) {
          tryDeluluPeriodStart = new Date(payload.data.created_at).getTime();
        }
        const tryDeluluPeriodEnd = payload.data.next_billing_date
          ? new Date(payload.data.next_billing_date).getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000;

        await ctx.runAction(
          internal.tryDeluluActions.handleTryDeluluActivated,
          {
            subscriptionId: payload.data.subscription_id,
            businessId: payload.business_id,
            customerId: payload.data.customer.customer_id,
            customerEmail: payload.data.customer?.email || "",
            productId: payload.data.product_id,
            currentPeriodStart: tryDeluluPeriodStart,
            currentPeriodEnd: tryDeluluPeriodEnd,
            webhookPayload: JSON.stringify(payload),
          }
        );
        return;
      }

      // Calculate period start from previous billing date, created date, or current time
      let periodStart = Date.now();
      if (payload.data.previous_billing_date) {
        periodStart = new Date(payload.data.previous_billing_date).getTime();
      } else if (payload.data.created_at) {
        periodStart = new Date(payload.data.created_at).getTime();
      }

      // Calculate period end from next billing date or default to 30 days
      const periodEnd = payload.data.next_billing_date
        ? new Date(payload.data.next_billing_date).getTime()
        : Date.now() + 30 * 24 * 60 * 60 * 1000;

      await ctx.runMutation(internal.webhooks.handleSubscriptionActivated, {
        subscriptionId: payload.data.subscription_id,
        businessId: payload.business_id,
        customerId: payload.data.customer.customer_id,
        customerEmail: payload.data.customer?.email || "",
        status: payload.data.status ?? "active",
        productId: payload.data.product_id,
        priceId: "", // Price ID not available in subscription schema
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription plan change (fired after changePlan() SDK call)
    onSubscriptionPlanChanged: async (ctx, payload) => {
      console.log(
        "[Dodo Webhook] Subscription plan changed:",
        payload.data.subscription_id,
        "→ product:",
        payload.data.product_id
      );

      // Calculate period dates
      let periodStart = Date.now();
      if (payload.data.previous_billing_date) {
        periodStart = new Date(payload.data.previous_billing_date).getTime();
      } else if (payload.data.created_at) {
        periodStart = new Date(payload.data.created_at).getTime();
      }

      const periodEnd = payload.data.next_billing_date
        ? new Date(payload.data.next_billing_date).getTime()
        : Date.now() + 30 * 24 * 60 * 60 * 1000;

      // Reuse the same handler as onSubscriptionActive — it handles
      // both new subscriptions and existing subscription updates
      await ctx.runMutation(internal.webhooks.handleSubscriptionActivated, {
        subscriptionId: payload.data.subscription_id,
        businessId: payload.business_id,
        customerId: payload.data.customer.customer_id,
        customerEmail: payload.data.customer?.email || "",
        status: payload.data.status ?? "active",
        productId: payload.data.product_id,
        priceId: "",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription cancellation
    onSubscriptionCancelled: async (ctx, payload) => {
      console.log(
        "[Dodo Webhook] Subscription cancelled:",
        payload.data.subscription_id
      );

      await ctx.runMutation(internal.webhooks.handleSubscriptionCancelled, {
        subscriptionId: payload.data.subscription_id,
        customerId: payload.data.customer.customer_id,
        cancellationReason: undefined, // Cancellation details not available in subscription schema
      });
    },

    // Handle payment failure
    onPaymentFailed: async (ctx, payload) => {
      console.log("[Dodo Webhook] Payment failed:", payload.data.payment_id);

      await ctx.runMutation(internal.webhooks.handlePaymentFailed, {
        paymentId: payload.data.payment_id,
        customerId: payload.data.customer.customer_id,
        customerEmail: payload.data.customer?.email,
        failureReason: payload.data.error_message || "Unknown error",
        amount: payload.data.total_amount,
        currency: payload.data.currency,
      });
    },
  }),
});

/**
 * Outrank Webhook Handler
 * Receives publish_articles events and upserts articles into the articles table.
 */
http.route({
  path: "/outrank-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Validate Bearer token
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.OUTRANK_WEBHOOK_SECRET;

    if (
      !(expectedSecret && authHeader) ||
      authHeader !== `Bearer ${expectedSecret}`
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = (await request.json()) as {
        event_type: string;
        timestamp?: string;
        data?: {
          articles?: Array<{
            id: string;
            title: string;
            slug: string;
            content_markdown: string;
            content_html: string;
            meta_description: string;
            image_url?: string | null;
            tags?: string[];
            created_at: string;
          }>;
        };
      };

      // Only handle publish_articles event
      if (body.event_type !== "publish_articles") {
        return new Response(
          JSON.stringify({ message: `Ignored event type: ${body.event_type}` }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const webhookTimestamp = body.timestamp
        ? new Date(body.timestamp).getTime()
        : Date.now();

      const rawArticles = body.data?.articles ?? [];

      // Transform snake_case payload to camelCase
      const articles = rawArticles.map((a) => ({
        outrankId: a.id,
        title: a.title,
        slug: a.slug,
        contentMarkdown: a.content_markdown,
        contentHtml: a.content_html,
        metaDescription: a.meta_description,
        imageUrl: a.image_url ?? undefined,
        tags: a.tags ?? [],
        outrankCreatedAt: new Date(a.created_at).getTime(),
        publishedAt: webhookTimestamp,
      }));

      await ctx.runMutation(internal.articles.upsertArticles, { articles });

      return new Response(
        JSON.stringify({
          success: true,
          processed: articles.length,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("Error in outrank-webhook:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to process webhook",
          message: error instanceof Error ? error.message : "Unknown error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
