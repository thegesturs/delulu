import type { WebhookEvent } from '@clerk/backend';
import { createDodoWebhookHandler } from '@dodopayments/convex';
import { httpRouter } from 'convex/server';
import { Webhook } from 'svix';
import { api, internal } from './_generated/api';
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
      const body = (await request.json()) as PublishPostRequestBody;
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
      await ctx.runAction(internal.posts.publishScheduledPost, {
        postId: postId as Id<'posts'>,
      });

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

      // Skip webhook if no subscription_id (one-off payment)
      if (!payload.data.subscription_id) {
        console.log(
          '[Dodo Webhook] Skipping payment without subscription_id (one-off charge)'
        );
        return;
      }

      await ctx.runMutation(internal.webhooks.handlePaymentSucceeded, {
        paymentId: payload.data.payment_id,
        businessId: payload.business_id,
        customerEmail: payload.data.customer?.email || '',
        customerId: payload.data.customer.customer_id,
        amount: payload.data.total_amount,
        currency: payload.data.currency,
        status: payload.data.status ?? 'pending',
        subscriptionId: payload.data.subscription_id,
        productId: payload.data.product_cart?.[0]?.product_id ?? '',
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription activation
    onSubscriptionActive: async (ctx, payload) => {
      console.log(
        '[Dodo Webhook] Subscription activated:',
        payload.data.subscription_id
      );

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
        customerEmail: payload.data.customer?.email || '',
        status: payload.data.status ?? 'active',
        productId: payload.data.product_id,
        priceId: '', // Price ID not available in subscription schema
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        webhookPayload: JSON.stringify(payload),
      });
    },

    // Handle subscription cancellation
    onSubscriptionCancelled: async (ctx, payload) => {
      console.log(
        '[Dodo Webhook] Subscription cancelled:',
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
      console.log('[Dodo Webhook] Payment failed:', payload.data.payment_id);

      await ctx.runMutation(internal.webhooks.handlePaymentFailed, {
        paymentId: payload.data.payment_id,
        customerId: payload.data.customer.customer_id,
        customerEmail: payload.data.customer?.email,
        failureReason: payload.data.error_message || 'Unknown error',
        amount: payload.data.total_amount,
        currency: payload.data.currency,
      });
    },
  }),
});

// ============================================================================
// Instagram Webhook (Backup/Alternative to Lambda)
// ============================================================================

/**
 * Validates the X-Hub-Signature-256 header from Meta using Web Crypto API
 */
async function validateInstagramSignature(
  payload: string,
  signature: string | undefined
): Promise<boolean> {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!signature || !appSecret) {
    return false;
  }

  try {
    // Import the secret key for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(appSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the payload
    const payloadData = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const expectedSignature = `sha256=${hashHex}`;

    // Compare signatures (not timing-safe, but acceptable for webhook validation)
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * GET: Webhook verification challenge from Meta
 */
http.route({
  path: '/instagram-webhook',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('[Instagram Webhook] Verification request:', {
      mode,
      token,
      challenge,
    });

    if (
      mode === 'subscribe' &&
      token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN
    ) {
      console.log('[Instagram Webhook] Verification successful');
      return new Response(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.error('[Instagram Webhook] Verification failed: invalid token');
    return new Response('Forbidden', { status: 403 });
  }),
});

/**
 * POST: Receive webhook events from Meta
 * This is a backup endpoint - primary processing is via Lambda
 */
http.route({
  path: '/instagram-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get('x-hub-signature-256') ?? undefined;
    const body = await request.text();

    // Validate signature
    if (!(await validateInstagramSignature(body, signature))) {
      console.error('[Instagram Webhook] Invalid signature');
      // Return 200 to prevent retries
      return new Response(JSON.stringify({ status: 'received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let payload: { object: string; entry: unknown[] };
    try {
      payload = JSON.parse(body);
    } catch {
      console.error('[Instagram Webhook] Failed to parse body');
      return new Response(JSON.stringify({ status: 'received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(
      '[Instagram Webhook] Received:',
      JSON.stringify(payload, null, 2)
    );

    // Only process Instagram events
    if (payload.object !== 'instagram') {
      console.log('[Instagram Webhook] Ignoring non-Instagram event');
      return new Response(JSON.stringify({ status: 'received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store the raw webhook event
    try {
      const eventId = `convex-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await ctx.runMutation(api.webhookEvents.createWebhookEvent, {
        eventId,
        platform: 'instagram',
        eventType: 'webhook',
        rawPayload: body,
        status: 'RECEIVED',
      });
    } catch (error) {
      console.error('[Instagram Webhook] Failed to store event:', error);
    }

    // Always return 200 to Instagram
    return new Response(JSON.stringify({ status: 'received' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

export default http;
