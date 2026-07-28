import { Context, Effect, Layer, Predicate } from "effect";
import { SqlClient } from "effect/unstable/sql";

export type MessageChannel = "transactional" | "lifecycle";

export interface LifecycleProviderApi {
  readonly name: "loops" | "noop";
  readonly identify: (input: {
    readonly userId: string;
    readonly email: string;
    readonly attributes: Readonly<Record<string, unknown>>;
  }) => Effect.Effect<void, unknown>;
  readonly track: (input: {
    readonly userId: string;
    readonly email: string;
    readonly event: string;
    readonly properties: Readonly<Record<string, unknown>>;
  }) => Effect.Effect<void, unknown>;
}

export class LifecycleProvider extends Context.Service<
  LifecycleProvider,
  LifecycleProviderApi
>()("@delulu/services/LifecycleProvider") {}

export interface TransactionalEmailProviderApi {
  readonly name: "cloudflare-email" | "noop";
  readonly send: (input: {
    readonly from?: string;
    readonly to: string;
    readonly subject: string;
    readonly html: string;
    readonly text: string;
    readonly replyTo?: string;
    readonly idempotencyKey: string;
  }) => Effect.Effect<{ readonly messageId?: string }, unknown>;
}

export class TransactionalEmailProvider extends Context.Service<
  TransactionalEmailProvider,
  TransactionalEmailProviderApi
>()("@delulu/services/TransactionalEmailProvider") {}

type DeliveryPayload =
  | {
      readonly kind: "identify";
      readonly userId: string;
      readonly email: string;
      readonly attributes: Readonly<Record<string, unknown>>;
    }
  | {
      readonly kind: "track";
      readonly userId: string;
      readonly email: string;
      readonly event: string;
      readonly properties: Readonly<Record<string, unknown>>;
    }
  | {
      readonly kind: "transactional";
      readonly from?: string;
      readonly to: string;
      readonly subject: string;
      readonly html: string;
      readonly text: string;
      readonly replyTo?: string;
    };

const randomKey = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;
const cancellationAllowedEvents = new Set([
  "cancellation_scheduled",
  "subscription.active",
  "payment_failed",
  "payment_succeeded",
]);

export class MessagingService extends Context.Service<
  MessagingService,
  {
    readonly identify: (input: {
      readonly userId: string;
      readonly email: string;
      readonly attributes: Readonly<Record<string, unknown>>;
      readonly idempotencyKey?: string;
    }) => Effect.Effect<void>;
    readonly track: (input: {
      readonly userId: string;
      readonly email: string;
      readonly event: string;
      readonly properties?: Readonly<Record<string, unknown>>;
      readonly idempotencyKey?: string;
    }) => Effect.Effect<void>;
    readonly preferences: (userId: string) => Effect.Effect<{
      readonly productLifecycleEnabled: boolean;
      readonly marketingEnabled: boolean;
    }>;
    readonly updatePreferences: (input: {
      readonly userId: string;
      readonly productLifecycleEnabled?: boolean;
      readonly marketingEnabled?: boolean;
    }) => Effect.Effect<void>;
    readonly sendTransactional: (input: {
      readonly userId: string;
      readonly email: string;
      readonly messageType: string;
      readonly subject: string;
      readonly html: string;
      readonly text: string;
      readonly replyTo?: string;
      readonly idempotencyKey: string;
      readonly metadata?: Readonly<Record<string, unknown>>;
    }) => Effect.Effect<{ readonly sent: boolean }>;
    readonly dispatchPending: (limit?: number) => Effect.Effect<number>;
  }
>()("@delulu/services/MessagingService") {
  static readonly layer = Layer.effect(
    MessagingService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const lifecycleProvider = yield* LifecycleProvider;
      const transactionalEmailProvider = yield* TransactionalEmailProvider;

      const ensurePreferences = (userId: string) =>
        sql`INSERT INTO email_preferences (user_id) VALUES (${userId})
          ON CONFLICT (user_id) DO NOTHING`.pipe(Effect.orDie);
      const enqueue = (input: {
        userId: string;
        idempotencyKey: string;
        channel: MessageChannel;
        messageType: string;
        provider: "loops" | "cloudflare-email" | "noop";
        payload: DeliveryPayload;
        metadata?: Readonly<Record<string, unknown>>;
        status?: "queued" | "suppressed";
        suppressionReason?: string;
      }) =>
        sql`INSERT INTO message_deliveries
          (id, user_id, idempotency_key, channel, message_type, provider, status,
            payload, metadata, suppression_reason)
          VALUES (${`message_${crypto.randomUUID()}`}, ${input.userId}, ${input.idempotencyKey},
            ${input.channel}, ${input.messageType}, ${input.provider}, ${input.status ?? "queued"},
            ${JSON.stringify(input.payload)}::jsonb, ${JSON.stringify(input.metadata ?? {})}::jsonb,
            ${input.suppressionReason ?? null})
          ON CONFLICT (idempotency_key) DO NOTHING`.pipe(
          Effect.asVoid,
          Effect.orDie
        );
      const preferences = Effect.fn("MessagingService.preferences")(function* (
        userId: string
      ) {
        yield* ensurePreferences(userId);
        const rows = yield* sql<{
          productLifecycleEnabled: boolean;
          marketingEnabled: boolean;
        }>`SELECT product_lifecycle_enabled, marketing_enabled
          FROM email_preferences WHERE user_id = ${userId}`.pipe(Effect.orDie);
        return {
          productLifecycleEnabled: rows[0]?.productLifecycleEnabled ?? true,
          marketingEnabled: rows[0]?.marketingEnabled ?? false,
        };
      });
      const identify = Effect.fn("MessagingService.identify")(
        function* (input: {
          readonly userId: string;
          readonly email: string;
          readonly attributes: Readonly<Record<string, unknown>>;
          readonly idempotencyKey?: string;
        }) {
          yield* ensurePreferences(input.userId);
          yield* enqueue({
            userId: input.userId,
            idempotencyKey: input.idempotencyKey ?? randomKey("identify"),
            channel: "lifecycle",
            messageType: "identify",
            provider: lifecycleProvider.name,
            payload: { kind: "identify", ...input },
          });
        }
      );
      const track = Effect.fn("MessagingService.track")(function* (input: {
        readonly userId: string;
        readonly email: string;
        readonly event: string;
        readonly properties?: Readonly<Record<string, unknown>>;
        readonly idempotencyKey?: string;
      }) {
        const preference = yield* preferences(input.userId);
        const payload: DeliveryPayload = {
          kind: "track",
          userId: input.userId,
          email: input.email,
          event: input.event,
          properties: input.properties ?? {},
        };
        const cancellation = yield* sql<{ pending: boolean }>`SELECT EXISTS(
          SELECT 1 FROM cancellation_requests WHERE billing_owner_user_id = ${input.userId}
            AND status IN ('scheduled','effective','deleting')
        ) AS pending`.pipe(Effect.orDie);
        const allowedDuringCancellation = cancellationAllowedEvents.has(
          input.event
        );
        const suppressionReason = preference.productLifecycleEnabled
          ? cancellation[0]?.pending && !allowedDuringCancellation
            ? "cancellation_pending"
            : null
          : "product_lifecycle_disabled";
        yield* enqueue({
          userId: input.userId,
          idempotencyKey: input.idempotencyKey ?? randomKey(input.event),
          channel: "lifecycle",
          messageType: input.event,
          provider: lifecycleProvider.name,
          payload,
          status: suppressionReason ? "suppressed" : "queued",
          suppressionReason: suppressionReason ?? undefined,
        });
      });
      const updatePreferences = Effect.fn("MessagingService.updatePreferences")(
        function* (input: {
          readonly userId: string;
          readonly productLifecycleEnabled?: boolean;
          readonly marketingEnabled?: boolean;
        }) {
          yield* ensurePreferences(input.userId);
          yield* sql`UPDATE email_preferences SET
            product_lifecycle_enabled = COALESCE(${input.productLifecycleEnabled}, product_lifecycle_enabled),
            marketing_enabled = COALESCE(${input.marketingEnabled}, marketing_enabled),
            unsubscribed_at = CASE
              WHEN ${input.productLifecycleEnabled === false} THEN now()
              WHEN ${input.productLifecycleEnabled === true} THEN NULL
              ELSE unsubscribed_at END
            WHERE user_id = ${input.userId}`.pipe(Effect.orDie);
          const contacts = yield* sql<{
            email: string | null;
            productLifecycleEnabled: boolean;
            marketingEnabled: boolean;
          }>`SELECT u.email, p.product_lifecycle_enabled, p.marketing_enabled
            FROM users u JOIN email_preferences p ON p.user_id = u.id
            WHERE u.id = ${input.userId}`.pipe(Effect.orDie);
          const contact = contacts[0];
          if (contact?.email) {
            yield* enqueue({
              userId: input.userId,
              idempotencyKey: `preferences:${input.userId}:${contact.productLifecycleEnabled}:${contact.marketingEnabled}:${crypto.randomUUID()}`,
              channel: "lifecycle",
              messageType: "preferences_updated",
              provider: lifecycleProvider.name,
              payload: {
                kind: "identify",
                userId: input.userId,
                email: contact.email,
                attributes: {
                  product_lifecycle_enabled: contact.productLifecycleEnabled,
                  marketing_enabled: contact.marketingEnabled,
                },
              },
            });
          }
        }
      );
      const sendTransactional = Effect.fn("MessagingService.sendTransactional")(
        function* (input: {
          readonly userId: string;
          readonly email: string;
          readonly messageType: string;
          readonly subject: string;
          readonly html: string;
          readonly text: string;
          readonly replyTo?: string;
          readonly idempotencyKey: string;
          readonly metadata?: Readonly<Record<string, unknown>>;
        }) {
          yield* enqueue({
            userId: input.userId,
            idempotencyKey: input.idempotencyKey,
            channel: "transactional",
            messageType: input.messageType,
            provider: transactionalEmailProvider.name,
            payload: {
              kind: "transactional",
              to: input.email,
              subject: input.subject,
              html: input.html,
              text: input.text,
              replyTo: input.replyTo,
            },
            metadata: input.metadata,
          });
          return { sent: true };
        }
      );
      const dispatchPending = Effect.fn("MessagingService.dispatchPending")(
        function* (limit = 50) {
          const claimed = yield* sql
            .withTransaction(
              sql<{
                id: string;
                idempotencyKey: string;
                payload: unknown;
                attempts: number;
              }>`
              WITH due AS (
                SELECT id FROM message_deliveries
                WHERE (status IN ('queued', 'failed') OR
                  (status = 'leased' AND locked_until < now()))
                  AND next_attempt_at <= now() AND attempts < max_attempts
                ORDER BY next_attempt_at, created_at FOR UPDATE SKIP LOCKED LIMIT ${limit}
              ) UPDATE message_deliveries m SET status = 'leased', attempts = attempts + 1,
                locked_until = now() + interval '2 minutes'
              FROM due WHERE m.id = due.id
              RETURNING m.id, m.idempotency_key, m.payload, m.attempts`
            )
            .pipe(Effect.orDie);
          for (const row of claimed) {
            const payload = row.payload as DeliveryPayload;
            const delivery =
              payload.kind === "identify"
                ? lifecycleProvider.identify(payload)
                : payload.kind === "track"
                  ? lifecycleProvider.track(payload)
                  : transactionalEmailProvider.send({
                      ...payload,
                      idempotencyKey: row.idempotencyKey,
                    });
            const result = yield* delivery.pipe(Effect.result);
            if (result._tag === "Success") {
              const messageId =
                Predicate.isObject(result.success) &&
                Predicate.isString(result.success.messageId)
                  ? result.success.messageId
                  : null;
              yield* sql`UPDATE message_deliveries SET status = 'sent', sent_at = now(),
                locked_until = NULL, last_error = NULL, provider_message_id = ${messageId}
                , provider_response = ${JSON.stringify(messageId ? { messageId } : {})}::jsonb
                WHERE id = ${row.id}`.pipe(Effect.orDie);
            } else {
              yield* sql`UPDATE message_deliveries SET
                status = CASE WHEN attempts >= max_attempts THEN 'dead'::text ELSE 'failed'::text END,
                next_attempt_at = now() + (LEAST(300, power(2, attempts)::integer) * interval '1 second'),
                locked_until = NULL, last_error = ${String(result.failure)} WHERE id = ${row.id}`.pipe(
                Effect.orDie
              );
            }
          }
          return claimed.length;
        }
      );
      return MessagingService.of({
        identify,
        track,
        preferences,
        updatePreferences,
        sendTransactional,
        dispatchPending,
      });
    })
  );
}
