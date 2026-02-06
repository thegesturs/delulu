import { createHmac } from 'node:crypto';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { Resource } from 'sst';

// ============================================================================
// Types
// ============================================================================

interface LambdaEvent {
  requestContext: { http: { method: string } };
  queryStringParameters?: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
  isBase64Encoded?: boolean;
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
// Signature Validation
// ============================================================================

function validateSignature(
  payload: string,
  signature: string | undefined,
  appSecret: string
): boolean {
  if (!signature) return false;
  const expected = `sha256=${createHmac('sha256', appSecret).update(payload).digest('hex')}`;
  return signature === expected;
}

// ============================================================================
// Condition Evaluation
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
          return new RegExp(condition.value || '', condition.caseSensitive ? '' : 'i').test(text);
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

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/{(\w+)}/g, (match, key) => variables[key] ?? match);
}

// ============================================================================
// Extract Comment Events
// ============================================================================

function extractCommentEvents(payload: InstagramWebhookPayload): CommentEvent[] {
  const events: CommentEvent[] = [];

  for (const entry of payload.entry) {
    if (!entry.changes) continue;
    for (const change of entry.changes) {
      if (change.field !== 'comments') continue;
      events.push({
        commentId: change.value.id,
        commentText: change.value.text || '',
        username: change.value.from.username,
        mediaId: change.value.media?.id,
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
    const data = (await response.json()) as { error?: { message?: string } };
    console.error('Instagram API error:', data.error?.message);
    return false;
  }

  return true;
}

// ============================================================================
// Process a single comment
// ============================================================================

async function processComment(
  convex: ConvexHttpClient,
  event: CommentEvent,
  secretKey: string
): Promise<void> {
  if (!event.mediaId) return;

  // 1. Single Convex query: automations + token + usage
  const data = await convex.query(api.automations.getForWebhook, {
    webhookSecret: secretKey,
    instagramAccountId: event.instagramAccountId,
    mediaId: event.mediaId,
  });

  if (!data) return;
  if ((data.dmsSent ?? 0) >= data.dmLimit) return;

  // 2. Evaluate conditions in-memory, find first match
  for (const automation of data.automations) {
    if (!evaluateConditions(event.commentText, automation.conditions)) continue;

    const message = renderTemplate(automation.messageTemplate, {
      username: event.username || 'there',
      comment_text: event.commentText,
    });

    const success = await sendPrivateReply(data.accessToken, data.profileId, event.commentId, message);

    if (success) {
      // 3. Single Convex mutation: increment usage + stats + log
      await convex.mutation(api.automations.recordDMSent, {
        webhookSecret: secretKey,
        userId: data.userId,
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUsername: event.username,
      });
    }

    // One reply per comment
    break;
  }
}

// ============================================================================
// Lambda Handler
// ============================================================================

const json = (statusCode: number, body: Record<string, string>) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function handler(event: LambdaEvent) {
  const method = event.requestContext.http.method;

  // GET: Webhook verification challenge
  if (method === 'GET') {
    const params = event.queryStringParameters || {};
    if (
      params['hub.mode'] === 'subscribe' &&
      params['hub.verify_token'] === Resource.INSTAGRAM_WEBHOOK_VERIFY_TOKEN.value
    ) {
      return { statusCode: 200, body: params['hub.challenge'] || '' };
    }
    return json(403, { error: 'Forbidden' });
  }

  // POST: Webhook event processing
  if (method === 'POST') {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString()
      : event.body || '';

    const signature = event.headers['x-hub-signature-256'];

    if (!validateSignature(body, signature, Resource.INSTAGRAM_APP_SECRET.value)) {
      return json(200, { status: 'received' });
    }

    let payload: InstagramWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      return json(200, { status: 'received' });
    }

    if (payload.object !== 'instagram') {
      return json(200, { status: 'received' });
    }

    // Process comments (Lambda waits for completion, no waitUntil needed)
    const convex = new ConvexHttpClient(Resource.CONVEX_URL.value);
    const commentEvents = extractCommentEvents(payload);

    for (const commentEvent of commentEvents) {
      try {
        await processComment(convex, commentEvent, Resource.LAMBDA_SECRET_KEY.value);
      } catch (error) {
        console.error('Error processing comment:', commentEvent.commentId, error);
      }
    }

    return json(200, { status: 'received' });
  }

  return json(405, { error: 'Method not allowed' });
}
