import { api } from '@delulu/database/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { Resource } from 'sst';

// ============================================================================
// Types
// ============================================================================

interface SQSRecord {
  body: string;
  messageId: string;
  receiptHandle: string;
}

interface SQSEvent {
  Records: SQSRecord[];
}

interface QueuedWebhookEvent {
  payload: InstagramWebhookPayload;
  receivedAt: number;
  eventId: string;
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
  userId: string;
  username?: string;
  mediaId?: string;
  instagramAccountId: string;
  timestamp: number;
}

// ============================================================================
// Convex Client
// ============================================================================

function getConvexClient() {
  return new ConvexHttpClient(Resource.CONVEX_URL.value);
}

// ============================================================================
// Condition Evaluation
// ============================================================================

function evaluateConditions(
  text: string,
  conditions: Array<{
    operator: string;
    value?: string;
    caseSensitive?: boolean;
  }>
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
          console.error('Invalid regex:', condition.value);
          return false;
        }
      default:
        console.warn('Unknown condition operator:', condition.operator);
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
// Instagram API
// ============================================================================

async function sendPrivateReply(
  accessToken: string,
  igUserId: string,
  commentId: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Use the messages endpoint with comment_id as recipient
    // Docs: POST /{ig-user-id}/messages with recipient.comment_id
    const response = await fetch(
      `https://graph.instagram.com/v24.0/${igUserId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: {
            comment_id: commentId,
          },
          message: {
            text: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Instagram API error:', data);
      return {
        success: false,
        error: data.error?.message || 'Unknown Instagram API error',
      };
    }

    return {
      success: true,
      messageId: data.message_id,
    };
  } catch (error) {
    console.error('Failed to send private reply:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// ============================================================================
// Main Processing Logic
// ============================================================================

function extractCommentEvents(
  payload: InstagramWebhookPayload
): CommentEvent[] {
  const events: CommentEvent[] = [];

  for (const entry of payload.entry) {
    if (!entry.changes) {
      continue;
    }

    for (const change of entry.changes) {
      if (change.field !== 'comments') {
        continue;
      }

      const { value } = change;
      events.push({
        commentId: value.id,
        commentText: value.text || '',
        userId: value.from.id,
        username: value.from.username,
        mediaId: value.media?.id,
        instagramAccountId: entry.id,
        timestamp: entry.time,
      });
    }
  }

  return events;
}

async function processCommentEvent(
  convex: ConvexHttpClient,
  event: CommentEvent
): Promise<void> {
  const startTime = Date.now();

  console.log('Processing comment event:', {
    commentId: event.commentId,
    userId: event.userId,
    mediaId: event.mediaId,
  });

  // 1. Check for duplicate processing
  const existingLog = await convex.query(api.automationLogs.getByCommentId, {
    instagramCommentId: event.commentId,
  });

  if (existingLog) {
    console.log('Comment already processed:', event.commentId);
    return;
  }

  // 2. Find the social provider for this Instagram account
  const socialProvider = await convex.query(
    api.social_providers.getByProfileId,
    {
      profileId: event.instagramAccountId,
      socialType: 'INSTAGRAM',
    }
  );

  if (!socialProvider) {
    console.log(
      'No social provider found for Instagram account:',
      event.instagramAccountId
    );
    return;
  }

  // 3. Get active automations for this social provider
  const automations = await convex.query(api.automations.getActiveByProvider, {
    socialProviderId: socialProvider._id,
    triggerType: 'COMMENT',
  });

  if (automations.length === 0) {
    console.log('No active automations for provider:', socialProvider._id);
    return;
  }

  // 4. Process each automation
  for (const automation of automations) {
    // Check if automation targets specific posts
    if (
      automation.targetPostIds &&
      automation.targetPostIds.length > 0 &&
      event.mediaId &&
      !automation.targetPostIds.includes(event.mediaId)
    ) {
      console.log(
        'Comment on non-targeted post, skipping automation:',
        automation._id
      );
      await convex.mutation(api.automationLogs.create, {
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUserId: event.userId,
        instagramUsername: event.username,
        instagramMediaId: event.mediaId,
        commentText: event.commentText,
        status: 'CONDITION_NOT_MET',
        processingTimeMs: Date.now() - startTime,
      });
      continue;
    }

    // Evaluate conditions
    if (!evaluateConditions(event.commentText, automation.conditions)) {
      console.log('Conditions not met for automation:', automation._id);
      await convex.mutation(api.automationLogs.create, {
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUserId: event.userId,
        instagramUsername: event.username,
        instagramMediaId: event.mediaId,
        commentText: event.commentText,
        status: 'CONDITION_NOT_MET',
        processingTimeMs: Date.now() - startTime,
      });
      continue;
    }

    // Check rate limits
    const rateLimits = await convex.query(api.automations.getRateLimitCounts, {
      automationId: automation._id,
    });

    if (rateLimits.hourCount >= automation.maxDMsPerHour) {
      console.log('Hourly rate limit exceeded for automation:', automation._id);
      await convex.mutation(api.automationLogs.create, {
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUserId: event.userId,
        instagramUsername: event.username,
        instagramMediaId: event.mediaId,
        commentText: event.commentText,
        status: 'RATE_LIMITED',
        errorMessage: 'Hourly rate limit exceeded',
        processingTimeMs: Date.now() - startTime,
      });
      continue;
    }

    if (rateLimits.dayCount >= automation.maxDMsPerDay) {
      console.log('Daily rate limit exceeded for automation:', automation._id);
      await convex.mutation(api.automationLogs.create, {
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUserId: event.userId,
        instagramUsername: event.username,
        instagramMediaId: event.mediaId,
        commentText: event.commentText,
        status: 'RATE_LIMITED',
        errorMessage: 'Daily rate limit exceeded',
        processingTimeMs: Date.now() - startTime,
      });
      continue;
    }

    // Render the message template
    const message = renderTemplate(automation.messageTemplate, {
      username: event.username || 'there',
      comment_text: event.commentText,
    });

    // Send the private reply using the messages endpoint
    // socialProvider.profileId is the IG_ID (user_id) needed for the endpoint
    const result = await sendPrivateReply(
      socialProvider.accessToken,
      socialProvider.profileId,
      event.commentId,
      message
    );

    // Log the result
    if (result.success) {
      console.log('Private reply sent successfully:', result.messageId);
      await convex.mutation(api.automationLogs.create, {
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUserId: event.userId,
        instagramUsername: event.username,
        instagramMediaId: event.mediaId,
        commentText: event.commentText,
        status: 'DM_SENT',
        dmMessageSent: message,
        instagramDMId: result.messageId,
        processingTimeMs: Date.now() - startTime,
      });

      // Update automation stats
      await convex.mutation(api.automations.incrementStats, {
        automationId: automation._id,
        field: 'totalDMsSent',
      });
    } else {
      console.error('Failed to send private reply:', result.error);
      await convex.mutation(api.automationLogs.create, {
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUserId: event.userId,
        instagramUsername: event.username,
        instagramMediaId: event.mediaId,
        commentText: event.commentText,
        status: 'DM_FAILED',
        dmMessageSent: message,
        errorMessage: result.error,
        processingTimeMs: Date.now() - startTime,
      });

      // Update automation stats
      await convex.mutation(api.automations.incrementStats, {
        automationId: automation._id,
        field: 'totalFailed',
      });
    }

    // Update triggered count
    await convex.mutation(api.automations.incrementStats, {
      automationId: automation._id,
      field: 'totalTriggered',
    });
  }
}

async function processRecord(
  convex: ConvexHttpClient,
  record: SQSRecord
): Promise<void> {
  let queuedEvent: QueuedWebhookEvent;

  try {
    queuedEvent = JSON.parse(record.body);
  } catch (error) {
    console.error('Failed to parse SQS message:', error);
    return;
  }

  const { payload, eventId } = queuedEvent;

  console.log('Processing webhook event:', eventId);

  // Store raw webhook event for debugging
  try {
    await convex.mutation(api.webhookEvents.createWebhookEvent, {
      eventId,
      platform: 'instagram',
      eventType: payload.entry?.[0]?.changes?.[0]?.field || 'unknown',
      rawPayload: JSON.stringify(payload),
      status: 'PROCESSING',
    });
  } catch (error) {
    console.error('Failed to store webhook event:', error);
  }

  try {
    // Extract and process comment events
    const commentEvents = extractCommentEvents(payload);

    for (const event of commentEvents) {
      await processCommentEvent(convex, event);
    }

    // Update webhook event status
    await convex.mutation(api.webhookEvents.updateByEventId, {
      eventId,
      status: 'PROCESSED',
      processedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Update webhook event status
    await convex.mutation(api.webhookEvents.updateByEventId, {
      eventId,
      status: 'FAILED',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    // Re-throw to trigger SQS retry
    throw error;
  }
}

// ============================================================================
// Lambda Handler
// ============================================================================

export async function handler(event: SQSEvent): Promise<void> {
  console.log(`Processing ${event.Records.length} webhook event(s)`);

  const convex = getConvexClient();

  for (const record of event.Records) {
    await processRecord(convex, record);
  }
}
