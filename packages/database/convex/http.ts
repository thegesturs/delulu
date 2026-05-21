import type { WebhookEvent } from "@clerk/backend";
import {
  ALL_SORTED_PRODUCT_IDS,
  isLifetimeProductId,
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

      // Organization events
      case "organization.created":
      case "organization.updated":
        await ctx.runMutation(internal.organizations.upsertFromClerk, {
          data: event.data,
        });
        break;

      case "organization.deleted":
        await ctx.runMutation(internal.organizations.deleteFromClerk, {
          clerkOrgId: event.data.id!,
        });
        break;

      // Organization membership events
      case "organizationMembership.created":
        await ctx.runMutation(internal.organizations.addMember, {
          data: event.data,
        });
        break;

      case "organizationMembership.deleted":
        await ctx.runMutation(internal.organizations.removeMember, {
          data: event.data,
        });
        break;

      case "organizationMembership.updated":
        await ctx.runMutation(internal.organizations.updateMemberRole, {
          data: event.data,
        });
        break;

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

      const productId = payload.data.product_cart?.[0]?.product_id ?? "";

      // Check if this is a lifetime deal purchase (one-time, no subscription)
      if (!payload.data.subscription_id && isLifetimeProductId(productId)) {
        console.log(
          "[Dodo Webhook] Lifetime deal purchase detected:",
          productId
        );

        await ctx.runMutation(internal.webhooks.handleLifetimePurchase, {
          paymentId: payload.data.payment_id,
          customerId: payload.data.customer.customer_id,
          customerEmail: payload.data.customer?.email || "",
          productId,
          amount: payload.data.total_amount,
          currency: payload.data.currency,
          webhookPayload: JSON.stringify(payload),
        });
        return;
      }

      // Skip webhook if no subscription_id (non-LTD one-off payment)
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

export default http;
