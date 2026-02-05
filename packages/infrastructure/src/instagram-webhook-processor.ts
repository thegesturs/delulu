import type { SQSEvent, SQSRecord } from 'aws-lambda';
import { Resource } from 'sst';

// ============================================================================
// Types
// ============================================================================

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

interface Automation {
  _id: string;
  socialProviderId: string;
  name: string;
  isActive: boolean;
  triggerType: string;
  targetPostIds?: string[];
  conditions: Array<{
    operator: string;
    value?: string;
    caseSensitive?: boolean;
  }>;
  messageTemplate: string;
  maxDMsPerHour: number;
  maxDMsPerDay: number;
  cooldownMinutes?: number;
}

interface SocialProvider {
  _id: string;
  profileId: string;
  accessToken: string;
  socialType: string;
}

// ============================================================================
// Convex Client
// ============================================================================

async function convexQuery<T>(
  functionPath: string,
  args: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${Resource.CONVEX_URL.value}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionPath,
      args,
    }),
  });

  if (!response.ok) {
    throw new Error(`Convex query failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.value as T;
}

async function convexMutation<T>(
  functionPath: string,
  args: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${Resource.CONVEX_URL.value}/api/mutation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionPath,
      args,
    }),
  });

  if (!response.ok) {
    throw new Error(`Convex mutation failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.value as T;
}

// ============================================================================
// Condition Evaluation
// ============================================================================

function evaluateConditions(
  text: string,
  conditions: Automation['conditions']
): boolean {
  // All conditions must match (AND logic)
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
  commentId: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Instagram Private Reply API
    // POST /{comment-id}/private_replies
    const response = await fetch(
      `https://graph.instagram.com/v21.0/${commentId}/private_replies`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          access_token: accessToken,
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
      messageId: data.id,
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
// Rate Limiting
// ============================================================================

async function checkRateLimits(
  automationId: string,
  maxPerHour: number,
  maxPerDay: number
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const result = await convexQuery<{
      hourCount: number;
      dayCount: number;
    }>('automations:getRateLimitCounts', {
      automationId,
    });

    if (result.hourCount >= maxPerHour) {
      return { allowed: false, reason: 'Hourly rate limit exceeded' };
    }

    if (result.dayCount >= maxPerDay) {
      return { allowed: false, reason: 'Daily rate limit exceeded' };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Failed to check rate limits:', error);
    // Allow if rate limit check fails (fail open)
    return { allowed: true };
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
    if (!entry.changes) continue;

    for (const change of entry.changes) {
      if (change.field !== 'comments') continue;

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

async function processCommentEvent(event: CommentEvent): Promise<void> {
  const startTime = Date.now();

  console.log('Processing comment event:', {
    commentId: event.commentId,
    userId: event.userId,
    mediaId: event.mediaId,
  });

  // 1. Check for duplicate processing
  const existingLog = await convexQuery<{ _id: string } | null>(
    'automationLogs:getByCommentId',
    {
      instagramCommentId: event.commentId,
    }
  );

  if (existingLog) {
    console.log('Comment already processed:', event.commentId);
    return;
  }

  // 2. Find the social provider for this Instagram account
  const socialProvider = await convexQuery<SocialProvider | null>(
    'social_providers:getByProfileId',
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
  const automations = await convexQuery<Automation[]>(
    'automations:getActiveByProvider',
    {
      socialProviderId: socialProvider._id,
      triggerType: 'COMMENT',
    }
  );

  if (automations.length === 0) {
    console.log(
      'No active automations for provider:',
      socialProvider._id
    );
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
      await convexMutation('automationLogs:create', {
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
      await convexMutation('automationLogs:create', {
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
    const rateLimitCheck = await checkRateLimits(
      automation._id,
      automation.maxDMsPerHour,
      automation.maxDMsPerDay
    );

    if (!rateLimitCheck.allowed) {
      console.log(
        'Rate limit exceeded for automation:',
        automation._id,
        rateLimitCheck.reason
      );
      await convexMutation('automationLogs:create', {
        automationId: automation._id,
        instagramCommentId: event.commentId,
        instagramUserId: event.userId,
        instagramUsername: event.username,
        instagramMediaId: event.mediaId,
        commentText: event.commentText,
        status: 'RATE_LIMITED',
        errorMessage: rateLimitCheck.reason,
        processingTimeMs: Date.now() - startTime,
      });
      continue;
    }

    // Render the message template
    const message = renderTemplate(automation.messageTemplate, {
      username: event.username || 'there',
      comment_text: event.commentText,
    });

    // Send the private reply
    const result = await sendPrivateReply(
      socialProvider.accessToken,
      event.commentId,
      message
    );

    // Log the result
    if (result.success) {
      console.log(
        'Private reply sent successfully:',
        result.messageId
      );
      await convexMutation('automationLogs:create', {
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
      await convexMutation('automations:incrementStats', {
        automationId: automation._id,
        field: 'totalDMsSent',
      });
    } else {
      console.error('Failed to send private reply:', result.error);
      await convexMutation('automationLogs:create', {
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
      await convexMutation('automations:incrementStats', {
        automationId: automation._id,
        field: 'totalFailed',
      });
    }

    // Update triggered count
    await convexMutation('automations:incrementStats', {
      automationId: automation._id,
      field: 'totalTriggered',
    });
  }
}

async function processRecord(record: SQSRecord): Promise<void> {
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
    await convexMutation('webhookEvents:create', {
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
      await processCommentEvent(event);
    }

    // Update webhook event status
    await convexMutation('webhookEvents:updateByEventId', {
      eventId,
      status: 'PROCESSED',
      processedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error processing webhook:', error);

    // Update webhook event status
    await convexMutation('webhookEvents:updateByEventId', {
      eventId,
      status: 'FAILED',
      errorMessage:
        error instanceof Error ? error.message : 'Unknown error',
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

  for (const record of event.Records) {
    await processRecord(record);
  }
}
