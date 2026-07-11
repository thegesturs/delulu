import { TokenCipher } from "@delulu/core";
import { BillingWebhookEvent } from "@delulu/core/domain/billing";
import { WebhookIngressError } from "@delulu/core/domain/webhook-delivery";
import {
  BillingWebhookApplication,
  PaymentWebhookSink,
  ProviderAudienceError,
  ProviderAudienceService,
  ProviderDmError,
  ProviderDmService,
} from "@delulu/services";
import { Effect, Layer, Predicate, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";

const API_BASE = "https://graph.instagram.com/v24.0";

interface Credentials {
  readonly profileId: string;
  readonly accessToken: string;
}

const connectionCredentials = Effect.fn("AutomationProvider.credentials")(
  function* (connectionId: string) {
    const sql = yield* SqlClient.SqlClient;
    const cipher = yield* TokenCipher;
    const rows = yield* sql<{
      platform: string;
      profileId: string;
      accessToken: string;
      cipherVersion: "v1";
    }>`SELECT platform, profile_id, access_token, cipher_version
        FROM connections WHERE id = ${connectionId} AND deleted_at IS NULL`;
    const row = rows[0];
    if (!row || row.platform !== "INSTAGRAM") {
      return yield* Effect.fail("connection_missing" as const);
    }
    const accessToken = yield* cipher.decrypt({
      ciphertext: row.accessToken,
      cipherVersion: row.cipherVersion,
    });
    return { profileId: row.profileId, accessToken } satisfies Credentials;
  }
);

const ProviderSendResponse = Schema.Struct({
  message_id: Schema.optional(Schema.String),
  recipient_id: Schema.optional(Schema.String),
});

export const AutomationProviderLive = Layer.mergeAll(
  Layer.effect(
    ProviderDmService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const cipher = yield* TokenCipher;
      const send = Effect.fn("AutomationProvider.sendDm")(function* (input) {
        const credentials = yield* connectionCredentials(
          input.connectionId
        ).pipe(
          Effect.provideService(SqlClient.SqlClient, sql),
          Effect.provideService(TokenCipher, cipher),
          Effect.mapError(
            () =>
              new ProviderDmError({
                message: "Unable to load the automation connection",
                retryable: false,
                deliveryState: "not_sent",
              })
          )
        );
        const quickReplies = input.buttons
          .filter(
            (button: unknown): button is { title: string; payload: string } =>
              Predicate.isObject(button) &&
              button.type === "quick_reply" &&
              Predicate.isString(button.title) &&
              Predicate.isString(button.payload)
          )
          .map((button: { title: string; payload: string }) => ({
            content_type: "text",
            title: button.title,
            payload: button.payload,
          }));
        const urlSuffix = input.buttons
          .filter(
            (button: unknown): button is { title: string; url: string } =>
              Predicate.isObject(button) &&
              button.type === "url" &&
              Predicate.isString(button.title) &&
              Predicate.isString(button.url)
          )
          .map(
            (button: { title: string; url: string }) =>
              `\n${button.title}: ${button.url}`
          )
          .join("");
        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(`${API_BASE}/${credentials.profileId}/messages`, {
              method: "POST",
              headers: {
                authorization: `Bearer ${credentials.accessToken}`,
                "content-type": "application/json",
                "idempotency-key": input.idempotencyKey,
              },
              body: JSON.stringify({
                recipient: { id: input.recipientId },
                message: {
                  text: `${input.message}${urlSuffix}`,
                  ...(quickReplies.length > 0
                    ? { quick_replies: quickReplies }
                    : {}),
                },
              }),
            }),
          catch: () =>
            new ProviderDmError({
              message: "DM provider request failed before acceptance",
              retryable: true,
              deliveryState: "not_sent",
            }),
        });
        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          return yield* new ProviderDmError({
            message: `DM provider returned ${response.status}`,
            retryable,
            deliveryState: "not_sent",
          });
        }
        const payload = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: () =>
            new ProviderDmError({
              message: "DM provider accepted the request without valid JSON",
              retryable: true,
              deliveryState: "unknown",
            }),
        }).pipe(
          Effect.flatMap(Schema.decodeUnknownEffect(ProviderSendResponse)),
          Effect.mapError((error) =>
            error instanceof ProviderDmError
              ? error
              : new ProviderDmError({
                  message: "DM provider returned an invalid response",
                  retryable: true,
                  deliveryState: "unknown",
                })
          )
        );
        const messageId = payload.message_id ?? payload.recipient_id;
        if (!messageId) {
          return yield* new ProviderDmError({
            message: "DM provider response did not identify the delivery",
            retryable: true,
            deliveryState: "unknown",
          });
        }
        return { messageId };
      });
      return ProviderDmService.of({ send });
    })
  ),
  Layer.effect(
    ProviderAudienceService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const cipher = yield* TokenCipher;
      const Response = Schema.Struct({
        is_user_follow_business: Schema.optional(Schema.Boolean),
      });
      const isFollower = Effect.fn("AutomationProvider.isFollower")(
        function* (input) {
          const credentials = yield* connectionCredentials(
            input.connectionId
          ).pipe(
            Effect.provideService(SqlClient.SqlClient, sql),
            Effect.provideService(TokenCipher, cipher),
            Effect.mapError(
              () =>
                new ProviderAudienceError({
                  message: "Unable to load the automation connection",
                  retryable: false,
                })
            )
          );
          const url = new URL(`${API_BASE}/${input.platformUserId}`);
          url.searchParams.set("fields", "is_user_follow_business");
          url.searchParams.set("access_token", credentials.accessToken);
          const response = yield* Effect.tryPromise({
            try: () => fetch(url),
            catch: () =>
              new ProviderAudienceError({
                message: "Audience lookup failed",
                retryable: true,
              }),
          });
          if (!response.ok) {
            return yield* new ProviderAudienceError({
              message: `Audience provider returned ${response.status}`,
              retryable: response.status === 429 || response.status >= 500,
            });
          }
          const json = yield* Effect.tryPromise({
            try: () => response.json(),
            catch: () =>
              new ProviderAudienceError({
                message: "Audience provider returned invalid JSON",
                retryable: false,
              }),
          });
          const decoded = yield* Schema.decodeUnknownEffect(Response)(
            json
          ).pipe(
            Effect.mapError(
              () =>
                new ProviderAudienceError({
                  message: "Audience provider returned an invalid response",
                  retryable: false,
                })
            )
          );
          return decoded.is_user_follow_business ?? false;
        }
      );
      return ProviderAudienceService.of({ isFollower });
    })
  )
);

const eventFromPaymentPayload = (eventId: string, input: unknown) => {
  if (!Predicate.isObject(input)) {
    return input;
  }
  return { ...input, eventId };
};

export const PaymentWebhookSinkLive = Layer.effect(
  PaymentWebhookSink,
  Effect.gen(function* () {
    const billing = yield* BillingWebhookApplication;
    return PaymentWebhookSink.of({
      process: Effect.fn("PaymentWebhookSink.process")(function* (input) {
        const candidate = eventFromPaymentPayload(
          input.eventId,
          input.event.data
        );
        const event = yield* Schema.decodeUnknownEffect(BillingWebhookEvent)(
          candidate
        ).pipe(
          Effect.mapError(
            () =>
              new WebhookIngressError({
                reason: "invalid_payload",
                message:
                  "Payment webhook data is not a normalized billing event",
                retryable: false,
              })
          )
        );
        yield* billing.apply(event).pipe(
          Effect.mapError(
            (error) =>
              new WebhookIngressError({
                reason: "processing_failed",
                message: error.message,
                retryable: error.retryable,
              })
          )
        );
      }),
    });
  })
);
