import type { WebhookEvent } from '@clerk/backend';
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

export default http;
