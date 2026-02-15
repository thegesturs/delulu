import { createHmac } from "node:crypto";
import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import type {
  AutomationStep,
  CommentReply,
  ConditionStep,
  DmButton,
  KeywordFilter,
  SendDmStep,
  TriggerStep,
} from "@delulu/database/convex/schemas/automations";
import { ConvexHttpClient } from "convex/browser";
import { Resource } from "sst";

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
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        quick_reply?: { payload: string };
      };
      postback?: {
        title?: string;
        payload: string;
      };
    }>;
  }>;
}

interface CommentEvent {
  commentId: string;
  commentText: string;
  username?: string;
  fromId: string; // commenter's Instagram-scoped ID
  mediaId?: string;
  instagramAccountId: string;
}

interface MessageEvent {
  senderId: string; // user's Instagram-scoped ID
  recipientId: string; // business account ID
  messageId: string;
  text?: string;
  quickReplyPayload?: string;
  instagramAccountId: string;
}

interface WebhookData {
  automations: Array<{
    _id: Id<"automations">;
    triggers: TriggerStep[];
    steps: AutomationStep[];
  }>;
  accessToken: string;
  profileId: string;
  userId: Id<"users">;
  planType: "FREE" | "VIBE" | "ECHO";
  dmsSent: number;
  dmLimit: number;
}

const FREE_WATERMARK = "\n\n- - -\nSent via @delulu.social";

// ============================================================================
// Signature Validation
// ============================================================================

function validateSignature(
  payload: string,
  signature: string | undefined,
  appSecret: string
): boolean {
  if (!signature) {
    return false;
  }
  const expected = `sha256=${createHmac("sha256", appSecret).update(payload).digest("hex")}`;
  return signature === expected;
}

// ============================================================================
// Condition Evaluation (text-based operators — synchronous)
// ============================================================================

function evaluateTextCondition(
  text: string,
  condition: Pick<ConditionStep, "operator" | "value" | "caseSensitive">
): boolean {
  const compareText = condition.caseSensitive ? text : text.toLowerCase();
  const compareValue = condition.caseSensitive
    ? condition.value || ""
    : (condition.value || "").toLowerCase();

  switch (condition.operator) {
    case "always":
      return true;
    case "contains":
      return compareText.includes(compareValue);
    case "not_contains":
      return !compareText.includes(compareValue);
    case "equals":
      return compareText === compareValue;
    case "starts_with":
      return compareText.startsWith(compareValue);
    case "ends_with":
      return compareText.endsWith(compareValue);
    case "regex":
      try {
        return new RegExp(
          condition.value || "",
          condition.caseSensitive ? "" : "i"
        ).test(text);
      } catch (e) {
        console.warn(`[condition] Invalid regex: "${condition.value}"`, e);
        return false;
      }
    default:
      return false;
  }
}

// ============================================================================
// Async Condition Evaluation (for API-based operators like is_follower)
// ============================================================================

async function evaluateConditionAsync(
  text: string,
  condition: Pick<ConditionStep, "operator" | "value" | "caseSensitive">,
  context: {
    accessToken: string;
    instagramUserId: string;
    convex: ConvexHttpClient;
    secretKey: string;
    socialProviderId?: string;
  }
): Promise<boolean> {
  switch (condition.operator) {
    case "is_follower":
      return checkIsFollower(context.accessToken, context.instagramUserId);
    case "has_email":
      if (!context.socialProviderId) {
        return false;
      }
      return context.convex.query(api.automations.checkContactHasEmail, {
        webhookSecret: context.secretKey,
        socialProviderId: context.socialProviderId as Id<"socialProviders">,
        instagramUserId: context.instagramUserId,
      });
    default:
      return evaluateTextCondition(text, condition);
  }
}

// ============================================================================
// Follower Check via Instagram Messaging API
// ============================================================================

async function checkIsFollower(
  accessToken: string,
  instagramUserId: string
): Promise<boolean> {
  try {
    // Use the Instagram Messaging API's user profile endpoint
    // which includes is_user_follow_business for users in conversation
    const response = await fetch(
      `https://graph.instagram.com/v24.0/${instagramUserId}?fields=is_user_follow_business&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.warn(
        `[follower-check] API returned ${response.status} for user ${instagramUserId}`
      );
      return false;
    }

    const data = (await response.json()) as {
      is_user_follow_business?: boolean;
    };
    return data.is_user_follow_business ?? false;
  } catch (e) {
    console.warn("[follower-check] Failed to check follower status:", e);
    return false;
  }
}

// ============================================================================
// Template Rendering
// ============================================================================

function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/{(\w+)}/g, (match, key) => variables[key] ?? match);
}

// ============================================================================
// Step-Based Flow Execution
// ============================================================================

interface FlowResult {
  message: string;
  buttons?: DmButton[];
  /** The send_dm step ID that produced this result (for session tracking) */
  stepId: string;
}

/**
 * Execute step flow starting from a specific step ID.
 * Used both for initial trigger execution and for resuming from button taps.
 */
async function executeStepFlowFromStep(
  startStepId: string,
  steps: AutomationStep[],
  commentText: string,
  variables: Record<string, string>,
  conditionContext: {
    accessToken: string;
    instagramUserId: string;
    convex: ConvexHttpClient;
    secretKey: string;
    socialProviderId?: string;
  }
): Promise<FlowResult | null> {
  const stepMap = new Map(steps.map((s) => [s.id, s]));
  let currentId: string | undefined = startStepId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const step = stepMap.get(currentId);
    if (!step) {
      break;
    }

    if (step.type === "send_dm") {
      return {
        message: renderTemplate(step.messageTemplate, variables),
        buttons: step.buttons,
        stepId: step.id,
      };
    }

    if (step.type === "condition") {
      const match = await evaluateConditionAsync(
        commentText,
        {
          operator: step.operator,
          value: step.value,
          caseSensitive: step.caseSensitive,
        },
        conditionContext
      );
      currentId = match ? step.yesStepId : step.noStepId;
      continue;
    }

    break;
  }

  return null;
}

/**
 * Execute step flow from a trigger (finds matching trigger, applies keyword filter).
 * Returns both the flow result and the matched trigger (for comment reply).
 */
async function executeStepFlow(
  triggers: TriggerStep[],
  steps: AutomationStep[],
  mediaId: string,
  commentText: string,
  variables: Record<string, string>,
  conditionContext: {
    accessToken: string;
    instagramUserId: string;
    convex: ConvexHttpClient;
    secretKey: string;
    socialProviderId?: string;
  }
): Promise<{ result: FlowResult; trigger: TriggerStep } | null> {
  // Find matching trigger (any trigger with this mediaId)
  const trigger = triggers.find((t) => t.targetPostIds.includes(mediaId));
  if (!trigger) {
    return null;
  }

  // Apply keyword filter if set
  if (trigger.keywordFilter && trigger.keywordFilter.operator !== "always") {
    const matches = evaluateTextCondition(commentText, {
      operator: trigger.keywordFilter.operator,
      value: trigger.keywordFilter.value,
      caseSensitive: trigger.keywordFilter.caseSensitive,
    });
    if (!matches) {
      console.log(
        `[keyword] Comment "${commentText}" did not match keyword filter (${trigger.keywordFilter.operator}: "${trigger.keywordFilter.value}")`
      );
      return null;
    }
  }

  if (!trigger.nextStepId) {
    return null;
  }

  const result = await executeStepFlowFromStep(
    trigger.nextStepId,
    steps,
    commentText,
    variables,
    conditionContext
  );

  if (!result) {
    return null;
  }
  return { result, trigger };
}

// ============================================================================
// Check if DM has branching buttons (quick_reply with nextStepId)
// ============================================================================

function hasBranchingButtons(buttons?: DmButton[]): boolean {
  if (!buttons) {
    return false;
  }
  return buttons.some(
    (b) => b.type === "quick_reply" && "nextStepId" in b && b.nextStepId
  );
}

// ============================================================================
// Extract Comment Events
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
      if (change.field !== "comments") {
        continue;
      }
      if (!(change.value?.from && change.value?.id)) {
        console.warn(
          "[extract] Malformed comment change, skipping:",
          JSON.stringify(change)
        );
        continue;
      }

      // Skip replies to comments (only top-level comments trigger automations)
      if (change.value.parent_id) {
        console.log(
          `[skip] Ignoring reply ${change.value.id} (parent: ${change.value.parent_id})`
        );
        continue;
      }

      // Skip comments from the page/bot itself
      if (change.value.from.id === entry.id) {
        console.log(
          `[skip] Ignoring self-comment ${change.value.id} from account ${entry.id}`
        );
        continue;
      }

      events.push({
        commentId: change.value.id,
        commentText: change.value.text || "",
        username: change.value.from.username,
        fromId: change.value.from.id,
        mediaId: change.value.media?.id,
        instagramAccountId: entry.id,
      });
    }
  }

  return events;
}

// ============================================================================
// Extract Message Events (button taps via quick_reply)
// ============================================================================

function extractMessageEvents(
  payload: InstagramWebhookPayload
): MessageEvent[] {
  const events: MessageEvent[] = [];

  for (const entry of payload.entry) {
    if (!entry.messaging) {
      continue;
    }
    for (const msg of entry.messaging) {
      // Skip echo messages (sent by us)
      if (msg.sender.id === entry.id) {
        continue;
      }

      // Handle quick_reply taps
      if (msg.message?.quick_reply?.payload) {
        events.push({
          senderId: msg.sender.id,
          recipientId: msg.recipient.id,
          messageId: msg.message.mid,
          text: msg.message.text,
          quickReplyPayload: msg.message.quick_reply.payload,
          instagramAccountId: entry.id,
        });
        continue;
      }

      // Handle postback button taps
      if (msg.postback?.payload) {
        events.push({
          senderId: msg.sender.id,
          recipientId: msg.recipient.id,
          messageId: `postback-${msg.timestamp}`,
          text: msg.postback.title,
          quickReplyPayload: msg.postback.payload,
          instagramAccountId: entry.id,
        });
      }
    }
  }

  return events;
}

// ============================================================================
// Send DM via Instagram API
// ============================================================================

async function sendDirectMessage(
  accessToken: string,
  profileId: string,
  recipient: { comment_id: string } | { id: string },
  message: string,
  buttons?: DmButton[]
): Promise<boolean> {
  // biome-ignore lint/suspicious/noExplicitAny: Instagram API body varies
  const body: any = {
    recipient,
    message: { text: message },
  };

  // Build template buttons (postback for quick_reply, web_url for url buttons)
  // Button template supports max 3 buttons total
  const templateButtons: Record<string, string>[] = [];

  for (const btn of buttons ?? []) {
    if (templateButtons.length >= 3) {
      break;
    }
    if (btn.type === "quick_reply") {
      templateButtons.push({
        type: "postback",
        title: btn.title,
        payload: btn.payload || btn.title,
      });
    } else if (btn.type === "url") {
      templateButtons.push({
        type: "web_url",
        title: btn.title,
        url: btn.url,
      });
    }
  }

  if (templateButtons.length > 0) {
    body.message = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: message,
          buttons: templateButtons,
        },
      },
    };
  }

  const response = await fetch(
    `https://graph.instagram.com/v24.0/${profileId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const data = (await response.json()) as { error?: { message?: string } };
    console.error("Instagram API error:", data.error?.message);
    return false;
  }

  return true;
}

// ============================================================================
// Reply to Comment
// ============================================================================

async function replyToComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<void> {
  const url = `https://graph.instagram.com/v24.0/${commentId}/replies`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    console.error("[reply] Failed to reply to comment:", commentId);
  }
}

// ============================================================================
// Process a single comment
// ============================================================================

async function processComment(
  convex: ConvexHttpClient,
  event: CommentEvent,
  secretKey: string
): Promise<void> {
  if (!event.mediaId) {
    console.log(`[skip] No mediaId for comment ${event.commentId}`);
    return;
  }

  console.log(
    `[process] Comment ${event.commentId} by @${event.username} on media ${event.mediaId}`
  );

  // 1. Single Convex query: automations + token + usage
  const data = await convex.query(api.automations.getForWebhook, {
    webhookSecret: secretKey,
    instagramAccountId: event.instagramAccountId,
    mediaId: event.mediaId,
  });

  if (!data) {
    console.log(`[skip] No matching automations for media ${event.mediaId}`);
    return;
  }

  if (data.dmLimit !== -1 && (data.dmsSent ?? 0) >= data.dmLimit) {
    console.log(`[skip] DM limit reached: ${data.dmsSent}/${data.dmLimit}`);
    return;
  }

  console.log(
    `[match] ${data.automations.length} automations, usage ${data.dmsSent ?? 0}/${data.dmLimit}`
  );

  // 2. Execute step-based flow, find first match
  const variables = {
    username: event.username || "there",
    comment_text: event.commentText,
  };

  const conditionContext = {
    accessToken: data.accessToken,
    instagramUserId: event.fromId,
    convex,
    secretKey,
  };

  for (const automation of data.automations) {
    const match = await executeStepFlow(
      automation.triggers,
      automation.steps,
      event.mediaId,
      event.commentText,
      variables,
      conditionContext
    );

    if (!match) {
      continue;
    }

    const { result, trigger: matchedTrigger } = match;

    // Append watermark for free plan users
    const message =
      data.planType === "FREE"
        ? result.message + FREE_WATERMARK
        : result.message;

    // Prefix button payloads with automationId for session lookup on tap
    const prefixedButtons = result.buttons?.map((btn) =>
      btn.type === "quick_reply"
        ? { ...btn, payload: `${automation._id}:${btn.payload}` }
        : btn
    );

    console.log(
      `[dm] Sending DM for automation ${automation._id} to @${event.username}`
    );
    const success = await sendDirectMessage(
      data.accessToken,
      data.profileId,
      { comment_id: event.commentId },
      message,
      prefixedButtons
    );

    if (success) {
      console.log(`[dm] DM sent successfully for comment ${event.commentId}`);

      // Record DM sent
      try {
        await convex.mutation(api.automations.recordDMSent, {
          webhookSecret: secretKey,
          userId: data.userId,
          automationId: automation._id,
          instagramCommentId: event.commentId,
          instagramUsername: event.username,
        });
      } catch (e) {
        console.error(
          `[record] Failed to record DM for ${event.commentId}:`,
          e
        );
      }

      // Create session if DM has branching buttons
      if (hasBranchingButtons(result.buttons)) {
        try {
          await convex.mutation(api.automations.createSession, {
            webhookSecret: secretKey,
            automationId: automation._id,
            userId: data.userId,
            instagramUserId: event.fromId,
            instagramUsername: event.username,
            currentStepId: result.stepId,
            triggerCommentId: event.commentId,
            triggerMediaId: event.mediaId,
            variables,
          });
          console.log(
            `[session] Created session for @${event.username} at step ${result.stepId}`
          );
        } catch (e) {
          console.error("[session] Failed to create session:", e);
        }
      }

      // Reply to comment if configured on the trigger
      const commentReply = matchedTrigger.commentReply;
      if (commentReply?.enabled && commentReply.replies.length > 0) {
        const reply =
          commentReply.replies[
            Math.floor(Math.random() * commentReply.replies.length)
          ];
        await replyToComment(data.accessToken, event.commentId, reply);
        console.log(`[reply] Replied to comment ${event.commentId}`);
      }
    } else {
      console.error(`[dm] DM failed for comment ${event.commentId}`);
    }

    // One reply per comment
    break;
  }
}

// ============================================================================
// Process a message event (button tap)
// ============================================================================

async function processMessageEvent(
  convex: ConvexHttpClient,
  event: MessageEvent,
  secretKey: string
): Promise<void> {
  console.log(
    `[message] Quick reply from ${event.senderId}: payload="${event.quickReplyPayload}"`
  );

  // Parse payload format: "automationId:stepId:buttonPayload"
  // The payload is the button's auto-generated payload ID
  // We need to find which automation/step/button this belongs to by checking active sessions

  // 1. Find social provider for this Instagram account
  // We'll use getForWebhook with a dummy mediaId — but we need a different approach
  // Instead, look for active sessions for this sender across all automations for this IG account

  // First, get all active automations for this Instagram account
  // We need the access token too. Use a broad query:
  const data = await convex.query(api.automations.getForWebhook, {
    webhookSecret: secretKey,
    instagramAccountId: event.instagramAccountId,
    mediaId: "__message_event__", // Won't match any trigger, but we need the provider data
  });

  // getForWebhook returns null if no matching automations for that mediaId
  // We need a fallback: query all active automations for this account
  // For now, let's try to find sessions directly

  // Try each active automation to find a session
  // Get all automations for this IG account (re-query without mediaId filter)
  // This is handled by looking up sessions which store the automationId

  // Alternative approach: iterate all automations for this IG account
  // Since we don't have a dedicated "getAllForAccount" query, we'll check sessions
  // by iterating automations that the sender might have sessions for

  // Actually, the cleanest approach: the session stores automationId,
  // and the automation stores the socialProviderId. Let's find sessions.

  // But we need the access token. Let's get all active automations for this IG account.
  // We'll modify our approach to get provider data first.

  // For message events, we look for ANY automation with an active session for this user
  // This requires a broader query. Let's just get all active automations for the account.

  // Since getForWebhook requires mediaId and returns null if no match,
  // let's handle this by checking each automation the hard way.
  // Actually, let's look at what we can query...

  // The simplest approach: iterate the payload to find the button,
  // then look up session. But payload is just a nanoid, we need context.

  // Best approach for MVP: Get all active automations for this Instagram account,
  // then for each, check if there's an active session for this sender.

  // We'll reuse getForWebhook logic but we need a version that doesn't filter by mediaId.
  // For now, use a workaround: the session itself has automationId, we can search sessions.

  // However, Convex queries need to be pre-defined. We already have getSessionForWebhook
  // but it requires automationId. We need to find which automation this belongs to.

  // Pragmatic approach: encode automationId in the payload
  // Payload format: "{automationId}:{buttonPayload}"
  const payloadParts = event.quickReplyPayload?.split(":") ?? [];
  if (payloadParts.length < 2) {
    console.log(
      `[message] Invalid payload format: "${event.quickReplyPayload}"`
    );
    return;
  }

  const automationId = payloadParts[0] as Id<"automations">;
  const buttonPayload = payloadParts.slice(1).join(":");

  // Look up the session
  const session = await convex.query(api.automations.getSessionForWebhook, {
    webhookSecret: secretKey,
    automationId,
    instagramUserId: event.senderId,
  });

  if (!session) {
    console.log(
      `[message] No active session for automation ${automationId}, user ${event.senderId}`
    );
    return;
  }

  // Get the automation to find the step and button
  const automation = await convex.query(api.automations.getForWebhook, {
    webhookSecret: secretKey,
    instagramAccountId: event.instagramAccountId,
    mediaId: session.triggerMediaId || "__session__",
  });

  if (!automation) {
    console.log("[message] Could not load automation data for session");
    return;
  }

  // Find the automation matching our session
  const matchingAutomation = automation.automations.find(
    (a) => a._id === automationId
  );
  if (!matchingAutomation) {
    console.log(
      `[message] Automation ${automationId} not found in webhook data`
    );
    return;
  }

  // Find the current step (the send_dm that had the buttons)
  const stepMap = new Map(matchingAutomation.steps.map((s) => [s.id, s]));
  const currentStep = stepMap.get(session.currentStepId);
  if (!currentStep || currentStep.type !== "send_dm") {
    console.log(
      `[message] Current step ${session.currentStepId} is not a send_dm`
    );
    return;
  }

  // Find the button that was tapped by matching the payload
  const tappedButton = (currentStep as SendDmStep).buttons?.find(
    (b) => b.type === "quick_reply" && b.payload === buttonPayload
  );
  if (
    !tappedButton ||
    tappedButton.type !== "quick_reply" ||
    !tappedButton.nextStepId
  ) {
    console.log(
      `[message] No branching button found for payload "${buttonPayload}"`
    );
    // Mark session completed — button has no next step
    await convex.mutation(api.automations.updateSession, {
      webhookSecret: secretKey,
      sessionId: session._id,
      status: "completed",
    });
    return;
  }

  // Execute the flow from the button's nextStepId
  const variables = (session.variables as Record<string, string>) || {};

  const conditionContext = {
    accessToken: automation.accessToken,
    instagramUserId: event.senderId,
    convex,
    secretKey,
  };

  const result = await executeStepFlowFromStep(
    tappedButton.nextStepId,
    matchingAutomation.steps,
    variables.comment_text || "",
    variables,
    conditionContext
  );

  if (!result) {
    console.log("[message] No result from step flow execution");
    await convex.mutation(api.automations.updateSession, {
      webhookSecret: secretKey,
      sessionId: session._id,
      status: "completed",
    });
    return;
  }

  // Apply watermark for free plan
  const message =
    automation.planType === "FREE"
      ? result.message + FREE_WATERMARK
      : result.message;

  // Prefix button payloads with automationId for session lookup on tap
  const prefixedButtons = result.buttons?.map((btn) =>
    btn.type === "quick_reply"
      ? { ...btn, payload: `${automationId}:${btn.payload}` }
      : btn
  );

  // Send DM directly to user (not via comment_id)
  const success = await sendDirectMessage(
    automation.accessToken,
    automation.profileId,
    { id: event.senderId },
    message,
    prefixedButtons
  );

  if (success) {
    console.log(
      `[message] Follow-up DM sent to ${event.senderId} at step ${result.stepId}`
    );

    // Record DM sent
    try {
      await convex.mutation(api.automations.recordDMSent, {
        webhookSecret: secretKey,
        userId: automation.userId,
        automationId,
        instagramCommentId: session.triggerCommentId || event.messageId,
        instagramUsername: session.instagramUsername,
      });
    } catch (e) {
      console.error("[message] Failed to record DM:", e);
    }

    // Update or complete the session
    if (hasBranchingButtons(result.buttons)) {
      await convex.mutation(api.automations.updateSession, {
        webhookSecret: secretKey,
        sessionId: session._id,
        currentStepId: result.stepId,
      });
    } else {
      await convex.mutation(api.automations.updateSession, {
        webhookSecret: secretKey,
        sessionId: session._id,
        currentStepId: result.stepId,
        status: "completed",
      });
    }
  } else {
    console.error(`[message] DM failed for user ${event.senderId}`);
  }
}

// ============================================================================
// Lambda Handler
// ============================================================================

const json = (statusCode: number, body: Record<string, string>) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(event: LambdaEvent) {
  const method = event.requestContext.http.method;

  // GET: Webhook verification challenge
  if (method === "GET") {
    const params = event.queryStringParameters || {};
    if (
      params["hub.mode"] === "subscribe" &&
      params["hub.verify_token"] ===
        Resource.INSTAGRAM_WEBHOOK_VERIFY_TOKEN.value
    ) {
      return { statusCode: 200, body: params["hub.challenge"] || "" };
    }
    return json(403, { error: "Forbidden" });
  }

  // POST: Webhook event processing
  if (method === "POST") {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString()
      : event.body || "";

    const signature = event.headers["x-hub-signature-256"];

    if (
      !validateSignature(body, signature, Resource.INSTAGRAM_APP_SECRET.value)
    ) {
      console.warn("[webhook] Invalid signature, rejecting");
      return json(401, { error: "Invalid signature" });
    }

    let payload: InstagramWebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      console.warn("[webhook] Invalid JSON body");
      return json(200, { status: "received" });
    }

    if (payload.object !== "instagram") {
      console.log(`[webhook] Ignoring non-instagram event: ${payload.object}`);
      return json(200, { status: "received" });
    }

    const convex = new ConvexHttpClient(Resource.CONVEX_URL.value);

    // Process comment events
    const commentEvents = extractCommentEvents(payload);
    console.log(`[webhook] Processing ${commentEvents.length} comment events`);

    for (const commentEvent of commentEvents) {
      try {
        await processComment(
          convex,
          commentEvent,
          Resource.LAMBDA_SECRET_KEY.value
        );
      } catch (error) {
        console.error(
          "Error processing comment:",
          commentEvent.commentId,
          error
        );
      }
    }

    // Process message events (button taps)
    const messageEvents = extractMessageEvents(payload);
    console.log(`[webhook] Processing ${messageEvents.length} message events`);

    for (const messageEvent of messageEvents) {
      try {
        await processMessageEvent(
          convex,
          messageEvent,
          Resource.LAMBDA_SECRET_KEY.value
        );
      } catch (error) {
        console.error(
          "Error processing message:",
          messageEvent.messageId,
          error
        );
      }
    }

    return json(200, { status: "received" });
  }

  return json(405, { error: "Method not allowed" });
}
