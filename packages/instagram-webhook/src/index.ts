import { ConvexHttpClient } from 'convex/browser';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';

// ============================================================================
// Types
// ============================================================================

interface Env {
  INSTAGRAM_APP_SECRET: string;
  INSTAGRAM_WEBHOOK_VERIFY_TOKEN: string;
  CONVEX_URL: string;
  WEBHOOK_SECRET: string;
}

interface InstagramWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    changes?: Array<{
      field: string;
      value: {
        from: { id: string; username?: string };
        media?: { id: string; media_product_type?: string };
        id: string;
        text?: string;
        parent_id?: string;
      };
    }>;
  }>;
}

interface CommentEvent {
  commentId: string;
  commentText: string;
  username?: string;
  mediaId?: string;
  instagramAccountId: string;
}

interface WebhookData {
  automations: Array<{
    _id: Id<'automations'>;
    conditions: Array<{
      operator: 'contains' | 'not_contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex' | 'always';
      value?: string;
      caseSensitive?: boolean;
    }>;
    messageTemplate: string;
  }>;
  accessToken: string;
  profileId: string;
  userId: Id<'users'>;
  dmsSent: number;
  dmLimit: number;
}

// ============================================================================
// Signature Validation (Web Crypto API)
// ============================================================================

async function validateSignature(
  payload: string,
  signature: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === `sha256=${hashHex}`;
}

// ============================================================================
// Condition Evaluation (pure function)
// ============================================================================

function evaluateConditions(
  text: string,
  conditions: WebhookData['automations'][0]['conditions']
): boolean {
  return conditions.every((condition) => {
    const compareText = condition.caseSensitive ? text : text.toLowerCase();
    const compareValue = condition.caseSensitive
      ? condition.value || ''
      : (condition.value || '').toLowerCase();

    switch (condition.operator) {
      case 'always':
        return true;
      case 'contains':
        return compareText.includes(compareValue);
      case 'not_contains':
        return !compareText.includes(compareValue);
      case 'equals':
        return compareText === compareValue;
      case 'starts_with':
        return compareText.startsWith(compareValue);
      case 'ends_with':
        return compareText.endsWith(compareValue);
      case 'regex':
        try {
          const regex = new RegExp(
            condition.value || '',
            condition.caseSensitive ? '' : 'i'
          );
          return regex.test(text);
        } catch {
          return false;
        }
      default:
        return false;
    }
  });
}

// ============================================================================
// Template Rendering
// ============================================================================

function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

// ============================================================================
// Extract Comment Events
// ============================================================================

function extractCommentEvents(
  payload: InstagramWebhookPayload
): CommentEvent[] {
  const events: CommentEvent[] = [];

  for (const entry of payload.entry) {
    if (!entry.changes) continue;

    for (const change of entry.changes) {
      if (change.field !== 'comments') continue;

      const { value } = change;
      events.push({
        commentId: value.id,
        commentText: value.text || '',
        username: value.from.username,
        mediaId: value.media?.id,
        instagramAccountId: entry.id,
      });
    }
  }

  return events;
}

// ============================================================================
// Send DM via Instagram API
// ============================================================================

async function sendPrivateReply(
  accessToken: string,
  profileId: string,
  commentId: string,
  message: string
): Promise<boolean> {
  const response = await fetch(
    `https://graph.instagram.com/v24.0/${profileId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json() as { error?: { message?: string } };
    console.error('Instagram API error:', data.error?.message);
    return false;
  }

  return true;
}

// ============================================================================
// Process a single comment event
// ============================================================================

async function processComment(
  convex: ConvexHttpClient,
  event: CommentEvent,
  webhookSecret: string
): Promise<void> {
  // No mediaId means we can't match any automation
  if (!event.mediaId) return;

  // 1. Single Convex query: get automations + token + usage
  const data = await convex.query(api.automations.getForWebhook, {
    webhookSecret,
    instagramAccountId: event.instagramAccountId,
    mediaId: event.mediaId,
  });

  // No match → done (1 Convex call total)
  if (!data) return;

  // Check plan limit
  if (data.dmsSent >= data.dmLimit) return;

  // 2. Evaluate conditions in-memory, find first match
  for (const automation of data.automations) {
    if (!evaluateConditions(event.commentText, automation.conditions)) {
      continue;
    }

    // Render message
    const message = renderTemplate(automation.messageTemplate, {
      username: event.username || 'there',
      comment_text: event.commentText,
    });

    // Send DM
    const success = await sendPrivateReply(
      data.accessToken,
      data.profileId,
      event.commentId,
      message
    );

    if (success) {
      // 3. Single Convex mutation: increment usage + stats + log
      await convex.mutation(api.automations.recordDMSent, {
        webhookSecret,
        userId: data.userId,
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUsername: event.username,
      });
    }

    // One reply per comment — stop after first match
    break;
  }
}

// ============================================================================
// Worker
// ============================================================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ========================================================================
    // GET: Webhook verification challenge
    // ========================================================================
    if (request.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      return new Response('Forbidden', { status: 403 });
    }

    // ========================================================================
    // POST: Webhook event processing
    // ========================================================================
    if (request.method === 'POST') {
      const body = await request.text();
      const signature = request.headers.get('x-hub-signature-256');

      // Validate signature
      if (!(await validateSignature(body, signature, env.INSTAGRAM_APP_SECRET))) {
        return new Response(JSON.stringify({ status: 'received' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      let payload: InstagramWebhookPayload;
      try {
        payload = JSON.parse(body);
      } catch {
        return new Response(JSON.stringify({ status: 'received' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Only process Instagram events
      if (payload.object !== 'instagram') {
        return new Response(JSON.stringify({ status: 'received' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Return 200 immediately, process in background
      const convex = new ConvexHttpClient(env.CONVEX_URL);
      const commentEvents = extractCommentEvents(payload);

      ctx.waitUntil(
        (async () => {
          for (const event of commentEvents) {
            try {
              await processComment(convex, event, env.WEBHOOK_SECRET);
            } catch (error) {
              console.error('Error processing comment:', event.commentId, error);
            }
          }
        })()
      );

      return new Response(JSON.stringify({ status: 'received' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  },
};
