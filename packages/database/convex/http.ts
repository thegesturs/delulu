import type { WebhookEvent } from '@clerk/backend';
import { createDodoWebhookHandler } from '@dodopayments/convex';
import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { httpAction } from './_generated/server';

const http = httpRouter();

/**
 * Type for CallMeLater publish post request body
 */
type PublishPostRequestBody = {
  postId: string;
};

/**
 * HTTP endpoint to receive scheduled post publishing requests from CallMeLater
 * This endpoint is called by CallMeLater at the scheduled time
 */
http.route({
  path: '/publishPost',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as PublishPostRequestBody;
      const { postId } = body;

      if (!postId) {
        return new Response(
          JSON.stringify({ error: 'Missing postId in request body' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Call the existing internal action to publish the post
      await ctx.runAction(internal.posts.publishScheduledPost, { postId: postId as Id<'posts'> });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error in publishPost HTTP endpoint:', error);

      return new Response(
        JSON.stringify({
          error: 'Failed to publish post',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }),
});

http.route({
  path: '/clerk-users-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request);
    if (!event) {
      return new Response('Error occurred', { status: 400 });
    }

    switch (event.type) {
      case 'user.created': // intentional fallthrough
      case 'user.updated':
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        });
        break;

      case 'user.deleted': {
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
    'svix-id': req.headers.get('svix-id')!,
    'svix-timestamp': req.headers.get('svix-timestamp')!,
    'svix-signature': req.headers.get('svix-signature')!,
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
  path: '/dodo-webhook',
  method: 'POST',
  handler: createDodoWebhookHandler({
    // Handle successful payments
    onPaymentSucceeded: async (ctx, payload) => {
      console.log('[Dodo Webhook] Payment succeeded:', payload.data.payment_id);

      await ctx.runMutation(internal.webhooks.handlePaymentSucceeded, {
        paymentId: payload.data.payment_id,
        businessId: payload.business_id,
        customerEmail: payload.data.customer?.email || '',
        customerId: payload.data.customer_id,
        amount: payload.data.total_amount,
        currency: payload.data.currency,
        status: payload.data.status,
        subscriptionId: payload.data.subscription_id,
        productId: payload.data.product_id,
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription activation
    onSubscriptionActive: async (ctx, payload) => {
      console.log('[Dodo Webhook] Subscription activated:', payload.data.subscription_id);

      await ctx.runMutation(internal.webhooks.handleSubscriptionActivated, {
        subscriptionId: payload.data.subscription_id,
        businessId: payload.business_id,
        customerId: payload.data.customer_id,
        customerEmail: payload.data.customer?.email || '',
        status: payload.data.status,
        productId: payload.data.product?.product_id || '',
        priceId: payload.data.product?.price_id || '',
        currentPeriodStart: payload.data.billing_period?.starts_at
          ? new Date(payload.data.billing_period.starts_at).getTime()
          : Date.now(),
        currentPeriodEnd: payload.data.billing_period?.ends_at
          ? new Date(payload.data.billing_period.ends_at).getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000, // Default 30 days
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription cancellation
    onSubscriptionCancelled: async (ctx, payload) => {
      console.log('[Dodo Webhook] Subscription cancelled:', payload.data.subscription_id);

      await ctx.runMutation(internal.webhooks.handleSubscriptionCancelled, {
        subscriptionId: payload.data.subscription_id,
        customerId: payload.data.customer_id,
        cancellationReason: payload.data.cancellation_details?.reason,
      });
    },

    // Handle payment failure
    onPaymentFailed: async (ctx, payload) => {
      console.log('[Dodo Webhook] Payment failed:', payload.data.payment_id);

      await ctx.runMutation(internal.webhooks.handlePaymentFailed, {
        paymentId: payload.data.payment_id,
        customerId: payload.data.customer_id,
        failureReason: payload.data.failure_message || 'Unknown error',
        amount: payload.data.total_amount,
        currency: payload.data.currency,
      });
    },
  }),
});

export default http;
