import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Resource } from 'sst';

const sqs = new SQSClient({});

interface WebhookEvent {
  headers: Record<string, string>;
  body?: string;
  rawPath?: string;
  queryStringParameters?: Record<string, string>;
  requestContext?: {
    http?: {
      method: string;
    };
  };
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
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
      };
    }>;
  }>;
}

/**
 * Validates the X-Hub-Signature-256 header from Meta
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
function validateSignature(
  payload: string,
  signature: string | undefined,
  appSecret: string
): boolean {
  if (!signature) {
    console.error('Missing X-Hub-Signature-256 header');
    return false;
  }

  const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(payload).digest('hex')}`;

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    console.error('Signature validation failed');
    return false;
  }
}

/**
 * Generates a deduplication ID for SQS based on webhook event data
 */
function generateDeduplicationId(payload: InstagramWebhookPayload): string {
  // Extract unique identifiers from the payload
  const entry = payload.entry?.[0];
  if (!entry) {
    return `unknown-${Date.now()}`;
  }

  // For comment webhooks
  if (entry.changes?.[0]) {
    const change = entry.changes[0];
    return `${entry.id}-${change.field}-${change.value?.id || Date.now()}`;
  }

  // For messaging webhooks
  if (entry.messaging?.[0]) {
    const message = entry.messaging[0];
    return `${entry.id}-message-${message.message?.mid || message.timestamp}`;
  }

  return `${entry.id}-${entry.time}`;
}

export async function handler(event: WebhookEvent) {
  const method =
    event.requestContext?.http?.method ||
    (event.queryStringParameters?.['hub.mode'] ? 'GET' : 'POST');

  // ============================================================================
  // GET: Webhook Verification Challenge
  // ============================================================================
  if (method === 'GET') {
    const mode = event.queryStringParameters?.['hub.mode'];
    const token = event.queryStringParameters?.['hub.verify_token'];
    const challenge = event.queryStringParameters?.['hub.challenge'];

    console.log('Webhook verification request:', { mode, token, challenge });

    if (mode === 'subscribe' && token === Resource.INSTAGRAM_WEBHOOK_VERIFY_TOKEN.value) {
      console.log('Webhook verification successful');
      return {
        statusCode: 200,
        body: challenge,
        headers: {
          'Content-Type': 'text/plain',
        },
      };
    }

    console.error('Webhook verification failed: invalid token');
    return {
      statusCode: 403,
      body: 'Forbidden',
    };
  }

  // ============================================================================
  // POST: Webhook Event
  // ============================================================================
  const signature = event.headers['x-hub-signature-256'];
  const body = event.body;

  if (!body) {
    console.error('Missing request body');
    // Always return 200 to Instagram to prevent retries
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'received' }),
    };
  }

  // Validate signature
  if (
    !validateSignature(
      body,
      signature,
      Resource.INSTAGRAM_APP_SECRET.value
    )
  ) {
    console.error('Invalid signature');
    // Return 200 to prevent retries of invalid requests
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'received' }),
    };
  }

  let payload: InstagramWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    console.error('Failed to parse webhook body:', error);
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'received' }),
    };
  }

  console.log('Received webhook:', JSON.stringify(payload, null, 2));

  // Only process Instagram events
  if (payload.object !== 'instagram') {
    console.log('Ignoring non-Instagram webhook:', payload.object);
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'received' }),
    };
  }

  // Queue the event for processing
  try {
    const deduplicationId = generateDeduplicationId(payload);

    await sqs.send(
      new SendMessageCommand({
        QueueUrl: Resource.InstagramWebhooksQueue.url,
        MessageBody: JSON.stringify({
          payload,
          receivedAt: Date.now(),
          eventId: deduplicationId,
        }),
        // Use message group ID for FIFO ordering if needed
        // MessageGroupId: payload.entry?.[0]?.id || 'default',
        // MessageDeduplicationId: deduplicationId,
      })
    );

    console.log('Webhook queued successfully:', deduplicationId);
  } catch (error) {
    console.error('Failed to queue webhook:', error);
    // Still return 200 - we don't want Instagram to retry
    // The webhook will be logged and can be manually replayed
  }

  // Always return 200 to Instagram
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'received' }),
  };
}
