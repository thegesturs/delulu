import { ClerkWebhookPayload } from "@delulu/contracts/src/clerk-webhooks";
import {
  DodoWebhookPayload,
  MetaWebhookPayload,
} from "@delulu/contracts/src/webhooks";
import type { AutomationEvent } from "@delulu/core/domain/automation-event";
import { WebhookIngressError } from "@delulu/core/domain/webhook-delivery";
import { Context, Effect, Layer, Schema } from "effect";
import { AutomationEngine } from "./automation-engine";
import { ClerkSyncService } from "./clerk-sync";
import { WebhookDeliveryService } from "./webhook-deliveries";

export class PaymentWebhookSink extends Context.Service<
  PaymentWebhookSink,
  {
    readonly process: (
      event: typeof DodoWebhookPayload.Type
    ) => Effect.Effect<void, WebhookIngressError>;
  }
>()("@delulu/services/PaymentWebhookSink") {}

const invalidPayload = (provider: string) =>
  new WebhookIngressError({
    reason: "invalid_payload",
    message: `Invalid ${provider} webhook payload`,
    retryable: false,
  });

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
          yield* deliveries.fail(claim.deliveryId, "Webhook processing failed");
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
                    const value = change.value;
                    if (!(value.from && value.media)) {
                      continue;
                    }
                    const event: AutomationEvent = {
                      _tag: "CommentReceived",
                      eventId: value.id,
                      profileId: entry.id,
                      triggerType:
                        change.field === "mentions" ? "mention" : "comment",
                      platformUserId: value.from.id,
                      platformUsername: value.from.username ?? null,
                      mediaId: value.media.id,
                      text: value.text ?? "",
                    };
                    yield* automations.evaluate(event);
                  }
                  for (const message of entry.messaging ?? []) {
                    if (!message.message) {
                      continue;
                    }
                    const storyId = message.message.reply_to?.story?.id;
                    const event: AutomationEvent = storyId
                      ? {
                          _tag: "CommentReceived",
                          eventId:
                            message.message.mid ??
                            `${entry.id}:${message.timestamp ?? eventId}`,
                          profileId: entry.id,
                          platformUserId: message.sender.id,
                          platformUsername: null,
                          triggerType: "story_reply",
                          mediaId: storyId,
                          text: message.message.text ?? "",
                        }
                      : {
                          _tag: "MessageReceived",
                          eventId:
                            message.message.mid ??
                            `${entry.id}:${message.timestamp ?? eventId}`,
                          profileId: entry.id,
                          platformUserId: message.sender.id,
                          platformUsername: null,
                          text: message.message.text,
                          quickReplyPayload:
                            message.message.quick_reply?.payload,
                        };
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
            handle: payments.process,
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
