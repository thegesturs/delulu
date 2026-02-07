import { createHmac } from "node:crypto";
import { api } from "@delulu/database/convex/_generated/api";
import type { Id } from "@delulu/database/convex/_generated/dataModel";
import type {
  AutomationStep,
  CommentReply,
  ConditionStep,
  DmButton,
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
// Condition Evaluation
// ============================================================================

function evaluateCondition(
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
  commentReply?: CommentReply;
}

function executeStepFlow(
  triggers: TriggerStep[],
  steps: AutomationStep[],
  mediaId: string,
  commentText: string,
  variables: Record<string, string>
): FlowResult | null {
  // 1. Find matching trigger (any trigger with this mediaId)
  const trigger = triggers.find((t) => t.targetPostIds.includes(mediaId));
  if (!trigger) {
    return null;
  }

  // 2. Build step map
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  // 3. Traverse from trigger.nextStepId
  let currentId = trigger.nextStepId;
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
        commentReply: step.commentReply,
      };
    }

    if (step.type === "condition") {
      const match = evaluateCondition(commentText, {
        operator: step.operator,
        value: step.value,
        caseSensitive: step.caseSensitive,
      });
      currentId = match ? step.yesStepId : step.noStepId;
      continue;
    }

    break;
  }

  return null;
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
      events.push({
        commentId: change.value.id,
        commentText: change.value.text || "",
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
  message: string,
  buttons?: DmButton[]
): Promise<boolean> {
  // biome-ignore lint/suspicious/noExplicitAny: Instagram API body varies
  const body: any = {
    recipient: { comment_id: commentId },
    message: { text: message },
  };

  // Add quick reply buttons
  const quickReplies = buttons?.filter((b) => b.type === "quick_reply") ?? [];
  const urlButtons = buttons?.filter((b) => b.type === "url") ?? [];

  if (quickReplies.length > 0) {
    body.message.quick_replies = quickReplies.slice(0, 13).map((b) => ({
      content_type: "text",
      title: b.title,
      payload: b.payload || b.title,
    }));
  } else if (urlButtons.length > 0) {
    body.message = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: message,
          buttons: urlButtons.slice(0, 3).map((b) => ({
            type: "web_url",
            url: b.url,
            title: b.title,
          })),
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

  if ((data.dmsSent ?? 0) >= data.dmLimit) {
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

  for (const automation of data.automations) {
    const result = executeStepFlow(
      automation.triggers,
      automation.steps,
      event.mediaId,
      event.commentText,
      variables
    );

    if (!result) {
      continue;
    }

    // Append watermark for free plan users
    const message =
      data.planType === "FREE"
        ? result.message + FREE_WATERMARK
        : result.message;

    console.log(
      `[dm] Sending DM for automation ${automation._id} to @${event.username}`
    );
    const success = await sendPrivateReply(
      data.accessToken,
      data.profileId,
      event.commentId,
      message,
      result.buttons
    );

    if (success) {
      console.log(`[dm] DM sent successfully for comment ${event.commentId}`);

      // Record DM sent (don't let failure block comment reply)
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

      // Reply to comment if configured
      if (
        result.commentReply?.enabled &&
        result.commentReply.replies.length > 0
      ) {
        const reply =
          result.commentReply.replies[
            Math.floor(Math.random() * result.commentReply.replies.length)
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

    // Process comments (Lambda waits for completion, no waitUntil needed)
    const convex = new ConvexHttpClient(Resource.CONVEX_URL.value);
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

    return json(200, { status: "received" });
  }

  return json(405, { error: "Method not allowed" });
}
