import {
  ClerkWebhookPayload,
  DodoWebhookPayload,
  MetaWebhookPayload,
} from "@delulu/contracts";
import type { AutomationEvent } from "@delulu/core/domain/automation-event";
import { WebhookIngressError } from "@delulu/core/domain/webhook-delivery";
import { Context, Effect, Layer, Schema } from "effect";
import { AutomationEngine } from "./automation-engine";
import { ClerkSyncService } from "./clerk-sync";
import { WebhookDeliveryService } from "./webhook-deliveries";

export class PaymentWebhookSink extends Context.Service<
  PaymentWebhookSink,
  {
    readonly process: (input: {
      readonly eventId: string;
      readonly event: typeof DodoWebhookPayload.Type;
    }) => Effect.Effect<void, WebhookIngressError>;
  }
>()("@delulu/services/PaymentWebhookSink") {}

const invalidPayload = (provider: string) =>
  new WebhookIngressError({
    reason: "invalid_payload",
    message: `Invalid ${provider} webhook payload`,
    retryable: false,
  });

type MetaEntry = (typeof MetaWebhookPayload.Type)["entry"][number];
type MetaChange = NonNullable<MetaEntry["changes"]>[number];
type MetaMessagingEvent = NonNullable<MetaEntry["messaging"]>[number];

export const metaCommentAutomationEvent = (
  profileId: string,
  change: MetaChange
): AutomationEvent | null => {
  const value = change.value;
  if (
    !(value.from && value.media) ||
    value.parent_id !== undefined ||
    value.from.id === profileId
  ) {
    return null;
  }
  return {
    _tag: "CommentReceived",
    eventId: value.id,
    profileId,
    triggerType: change.field === "mentions" ? "mention" : "comment",
    platformUserId: value.from.id,
    platformUsername: value.from.username ?? null,
    mediaId: value.media.id,
    text: value.text ?? "",
  };
};

export const metaMessagingAutomationEvent = (
  profileId: string,
  message: MetaMessagingEvent,
  fallbackEventId: string
): AutomationEvent | null => {
  if (!(message.message || message.postback)) {
    return null;
  }
  const storyId = message.message?.reply_to?.story?.id;
  if (storyId) {
    return {
      _tag: "CommentReceived",
      eventId:
        message.message?.mid ??
        `${profileId}:${message.timestamp ?? fallbackEventId}`,
      profileId,
      platformUserId: message.sender.id,
      platformUsername: null,
      triggerType: "story_reply",
      mediaId: storyId,
      text: message.message?.text ?? "",
    };
  }
  return {
    _tag: "MessageReceived",
    eventId:
      message.message?.mid ??
      message.postback?.mid ??
      `${profileId}:${message.timestamp ?? fallbackEventId}`,
    profileId,
    platformUserId: message.sender.id,
    platformUsername: null,
    text: message.message?.text ?? message.postback?.title,
    quickReplyPayload:
      message.message?.quick_reply?.payload ?? message.postback?.payload,
  };
};

export class WebhookIngressService extends Context.Service<
  WebhookIngressService,
  {
    readonly processMeta: (
      eventId: string,
      rawBody: string
    ) => Effect.Effect<boolean, WebhookIngressError>;
    readonly processClerk: (
      eventId: string,
      rawBody: string
    ) => Effect.Effect<boolean, WebhookIngressError>;
    readonly processDodo: (
      eventId: string,
      rawBody: string
    ) => Effect.Effect<boolean, WebhookIngressError>;
  }
>()("@delulu/services/WebhookIngressService") {
  static readonly layer = Layer.effect(
    WebhookIngressService,
    Effect.gen(function* () {
      const deliveries = yield* WebhookDeliveryService;
      const automations = yield* AutomationEngine;
      const clerk = yield* ClerkSyncService;
      const payments = yield* PaymentWebhookSink;

      const process = Effect.fn("WebhookIngressService.process")(function* <
        A,
      >(input: {
        readonly provider: "meta" | "clerk" | "dodo";
        readonly eventId: string;
        readonly rawBody: string;
        readonly schema: Schema.Decoder<A, never>;
        readonly handle: (payload: A) => Effect.Effect<void, unknown>;
      }) {
        const payload = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(input.schema)
        )(input.rawBody).pipe(
          Effect.mapError(() => invalidPayload(input.provider))
        );
        const claim = yield* deliveries.claim({
          provider: input.provider,
          eventId: input.eventId,
          payload: input.rawBody,
        });
        if (claim._tag === "Duplicate") {
          return false;
        }
        const handled = yield* input.handle(payload).pipe(Effect.result);
        if (handled._tag === "Failure") {
          const failureMessage =
            typeof handled.failure === "object" &&
            handled.failure !== null &&
            "message" in handled.failure &&
            typeof handled.failure.message === "string"
              ? handled.failure.message
              : "Webhook processing failed";
          yield* Effect.logError("Webhook processing failed", {
            provider: input.provider,
            eventId: input.eventId,
            failure: failureMessage,
          });
          yield* deliveries.fail(claim.deliveryId, failureMessage);
          return yield* new WebhookIngressError({
            reason: "processing_failed",
            message: "Webhook processing failed",
            retryable: true,
          });
        }
        yield* deliveries.complete(claim.deliveryId);
        return true;
      });

      const processMeta = Effect.fn("WebhookIngressService.processMeta")(
        (eventId: string, rawBody: string) =>
          process({
            provider: "meta",
            eventId,
            rawBody,
            schema: MetaWebhookPayload,
            handle: Effect.fn("WebhookIngressService.handleMeta")(
              function* (payload) {
                for (const entry of payload.entry) {
                  for (const change of entry.changes ?? []) {
                    const event = metaCommentAutomationEvent(entry.id, change);
                    if (!event) {
                      continue;
                    }
                    yield* automations.evaluate(event);
                  }
                  for (const message of entry.messaging ?? []) {
                    const event = metaMessagingAutomationEvent(
                      entry.id,
                      message,
                      eventId
                    );
                    if (!event) {
                      continue;
                    }
                    yield* automations.evaluate(event);
                  }
                }
              }
            ),
          })
      );
      const processClerk = Effect.fn("WebhookIngressService.processClerk")(
        (eventId: string, rawBody: string) =>
          process({
            provider: "clerk",
            eventId,
            rawBody,
            schema: ClerkWebhookPayload,
            handle: (payload) => clerk.sync(payload),
          })
      );
      const processDodo = Effect.fn("WebhookIngressService.processDodo")(
        (eventId: string, rawBody: string) =>
          process({
            provider: "dodo",
            eventId,
            rawBody,
            schema: DodoWebhookPayload,
            handle: (event) => payments.process({ eventId, event }),
          })
      );
      return WebhookIngressService.of({
        processMeta,
        processClerk,
        processDodo,
      });
    })
  );
}
