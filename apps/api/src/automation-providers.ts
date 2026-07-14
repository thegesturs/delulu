import { TokenCipher } from "@delulu/core";
import { BillingWebhookEvent } from "@delulu/core/domain/billing";
import { WebhookIngressError } from "@delulu/core/domain/webhook-delivery";
import { getPlanFromProductId } from "@delulu/payments";
import {
  BillingWebhookApplication,
  MessagingService,
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
    if (row?.platform !== "INSTAGRAM") {
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

const stringField = (value: unknown, key: string): string | undefined =>
  Predicate.isObject(value) && Predicate.isString(value[key])
    ? value[key]
    : undefined;

const numberField = (value: unknown, key: string): number | undefined =>
  Predicate.isObject(value) && Predicate.isNumber(value[key])
    ? value[key]
    : undefined;

const booleanField = (value: unknown, key: string): boolean | undefined =>
  Predicate.isObject(value) && Predicate.isBoolean(value[key])
    ? value[key]
    : undefined;

const objectField = (value: unknown, key: string): object | undefined =>
  Predicate.isObject(value) && Predicate.isObject(value[key])
    ? value[key]
    : undefined;

const providerData = (input: unknown): object | undefined => {
  if (!Predicate.isObject(input)) {
    return undefined;
  }
  return objectField(input, "object") ?? input;
};

const invalidBillingPayload = (message: string) =>
  new WebhookIngressError({
    reason: "invalid_payload",
    message,
    retryable: false,
  });

const billingLookupFailed = () =>
  new WebhookIngressError({
    reason: "processing_failed",
    message: "Unable to resolve the payment webhook owner",
    retryable: true,
  });

export const PaymentWebhookSinkLive = Layer.effect(
  PaymentWebhookSink,
  Effect.gen(function* () {
    const billing = yield* BillingWebhookApplication;
    const messaging = yield* MessagingService;
    const sql = yield* SqlClient.SqlClient;

    const resolveBillingOwner = Effect.fn("PaymentWebhook.resolveOwner")(
      function* (data: object) {
        const metadata = objectField(data, "metadata");
        const metadataOwner = metadata
          ? (stringField(metadata, "billing_owner_user_id") ??
            stringField(metadata, "billingOwnerUserId"))
          : undefined;
        if (metadataOwner) {
          return metadataOwner;
        }

        const customer = objectField(data, "customer");
        const customerId = customer
          ? stringField(customer, "customer_id")
          : undefined;
        if (customerId) {
          const owners = yield* sql<{ billingOwnerUserId: string }>`
            SELECT billing_owner_user_id FROM subscriptions
            WHERE provider_customer_id = ${customerId} LIMIT 1`.pipe(
            Effect.mapError(billingLookupFailed)
          );
          if (owners[0]) {
            return owners[0].billingOwnerUserId;
          }
        }

        return yield* invalidBillingPayload(
          "Payment webhook requires billing-owner metadata or a known provider customer"
        );
      }
    );

    const normalize = Effect.fn("PaymentWebhook.normalize")(function* (
      eventId: string,
      type: string,
      rawData: unknown
    ) {
      if (!(type.startsWith("subscription.") || type.startsWith("payment."))) {
        return null;
      }
      const data = providerData(rawData);
      if (!data) {
        return yield* invalidBillingPayload(
          "Payment webhook data must be an object"
        );
      }
      const billingOwnerUserId = yield* resolveBillingOwner(data);
      const customer = objectField(data, "customer");
      const customerId = customer
        ? (stringField(customer, "customer_id") ?? null)
        : null;

      if (type.startsWith("subscription.")) {
        const subscriptionId = stringField(data, "subscription_id");
        const productId = stringField(data, "product_id");
        const status = stringField(data, "status") ?? type.slice(13);
        if (!(subscriptionId && productId)) {
          return yield* invalidBillingPayload(
            "Subscription webhook is missing its subscription or product id"
          );
        }
        const plan = getPlanFromProductId(productId)?.planType ?? productId;
        return {
          _tag: "SubscriptionChanged" as const,
          eventId,
          providerEventType: type,
          billingOwnerUserId,
          providerCustomerId: customerId,
          providerSubscriptionId: subscriptionId,
          plan,
          status,
          currentPeriodStart:
            stringField(data, "previous_billing_date") ?? null,
          currentPeriodEnd: stringField(data, "next_billing_date") ?? null,
          billingInterval:
            stringField(data, "payment_frequency_interval")?.toUpperCase() ??
            null,
          currency: stringField(data, "currency") ?? null,
          recurringAmountMinor:
            numberField(data, "recurring_pre_tax_amount") ?? null,
          cancelAtPeriodEnd:
            booleanField(data, "cancel_at_next_billing_date") ?? false,
          addons: { items: "addons" in data ? data.addons : [] },
        };
      }

      if (type.startsWith("payment.")) {
        const paymentId = stringField(data, "payment_id");
        const amount = numberField(data, "total_amount");
        const currency = stringField(data, "currency");
        if (!(paymentId && amount !== undefined && currency)) {
          return yield* invalidBillingPayload(
            "Payment webhook is missing its id, amount, or currency"
          );
        }
        return {
          _tag: "TransactionChanged" as const,
          eventId,
          providerEventType: type,
          billingOwnerUserId,
          providerTransactionId: paymentId,
          amountMinor: amount,
          currency,
          status: stringField(data, "status") ?? type.slice(8),
          metadata: {
            ...(objectField(data, "metadata") ?? {}),
            providerCustomerId: customerId,
            providerSubscriptionId:
              stringField(data, "subscription_id") ?? null,
          },
        };
      }
    });

    return PaymentWebhookSink.of({
      process: Effect.fn("PaymentWebhookSink.process")(function* (input) {
        const candidate = yield* normalize(
          input.eventId,
          input.event.type,
          input.event.data
        );
        if (candidate === null) {
          return;
        }
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
        // Re-run durable outbox writes on provider replay. Their idempotency
        // keys make this safe and recover a prior attempt that committed the
        // billing event but failed before enqueueing lifecycle messages.
        const recipients = yield* sql<{
          email: string | null;
        }>`SELECT email FROM users
          WHERE id = ${event.billingOwnerUserId}`.pipe(
          Effect.mapError(billingLookupFailed)
        );
        const email = recipients[0]?.email;
        if (!email) {
          return;
        }
        if (event._tag === "SubscriptionChanged") {
          yield* messaging.identify({
            userId: event.billingOwnerUserId,
            email,
            attributes: {
              paid_plan: event.plan,
              subscription_status: event.status,
              billing_period_end: event.currentPeriodEnd,
              billing_interval: event.billingInterval,
              cancellation_pending: event.cancelAtPeriodEnd,
            },
            idempotencyKey: `billing:${event.eventId}:identify`,
          });
          yield* messaging.track({
            userId: event.billingOwnerUserId,
            email,
            event: event.providerEventType,
            properties: {
              plan: event.plan,
              status: event.status,
              billing_interval: event.billingInterval,
              cancellation_pending: event.cancelAtPeriodEnd,
            },
            idempotencyKey: `billing:${event.eventId}:subscription`,
          });
        } else {
          yield* messaging.track({
            userId: event.billingOwnerUserId,
            email,
            event:
              event.providerEventType === "payment.failed"
                ? "payment_failed"
                : "payment_succeeded",
            properties: {
              amount_minor: event.amountMinor,
              currency: event.currency,
            },
            idempotencyKey: `billing:${event.eventId}:payment`,
          });
          if (event.providerEventType === "payment.failed") {
            yield* messaging.sendTransactional({
              userId: event.billingOwnerUserId,
              email,
              messageType: "payment_failed",
              subject: "Action needed: payment failed",
              html: "<h1>Your payment failed</h1><p>Please update your payment method to keep publishing and automations running.</p>",
              text: "Your payment failed. Please update your payment method to keep publishing and automations running.",
              replyTo: "notify@delulu.social",
              idempotencyKey: `payment-failed:${event.eventId}`,
            });
          }
        }
      }),
    });
  })
);
