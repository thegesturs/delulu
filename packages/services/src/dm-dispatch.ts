import type { AutomationButton, AutomationId } from "@delulu/core";
import { getPlanLimits } from "@delulu/payments/plans";
import { Context, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { EntitlementPolicy } from "./entitlements";

export class ProviderDmError extends Schema.TaggedErrorClass<ProviderDmError>()(
  "ProviderDmError",
  {
    message: Schema.String,
    retryable: Schema.Boolean,
    deliveryState: Schema.Literals(["not_sent", "unknown"]),
  }
) {}
export class DmDispatchError extends Schema.TaggedErrorClass<DmDispatchError>()(
  "DmDispatchError",
  { message: Schema.String, retryable: Schema.Boolean }
) {}

export interface ProviderDmInput {
  readonly connectionId: string;
  readonly recipientId: string;
  /**
   * The triggering comment ID used for Instagram's first private reply.
   * Normal conversation messages continue to address the Instagram-scoped
   * user ID in recipientId.
   */
  readonly recipientCommentId?: string;
  readonly message: string;
  readonly buttons: readonly AutomationButton[];
}
export interface ProviderDmRequest extends ProviderDmInput {
  /** Providers must use this key to make a reclaimed reservation safe to retry. */
  readonly idempotencyKey: string;
}
export class ProviderDmService extends Context.Service<
  ProviderDmService,
  {
    readonly send: (
      input: ProviderDmRequest
    ) => Effect.Effect<{ readonly messageId: string }, ProviderDmError>;
  }
>()("@delulu/services/ProviderDmService") {}

export interface SendDmOnceInput extends ProviderDmInput {
  readonly provider: "meta";
  readonly eventId: string;
  readonly automationId: AutomationId;
  readonly stepId: string;
}
export type SendDmOnceResult =
  | { readonly _tag: "Sent"; readonly messageId: string }
  | { readonly _tag: "Skipped"; readonly reason: "quota" }
  | { readonly _tag: "Duplicate" };

type Reservation =
  | { readonly _tag: "Reserved"; readonly billingOwnerUserId: string }
  | { readonly _tag: "Skipped" }
  | { readonly _tag: "Duplicate" };

export const dmSoftLimit = (planLimit: number): number =>
  planLimit === -1 ? -1 : Math.ceil(planLimit * 1.1);

export class DmDispatchService extends Context.Service<
  DmDispatchService,
  {
    readonly sendOnce: (
      input: SendDmOnceInput
    ) => Effect.Effect<SendDmOnceResult, DmDispatchError | ProviderDmError>;
  }
>()("@delulu/services/DmDispatchService") {
  static readonly layer = Layer.effect(
    DmDispatchService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const provider = yield* ProviderDmService;
      const entitlements = yield* EntitlementPolicy;
      const persistenceError = (message = "Unable to reserve DM delivery") =>
        new DmDispatchError({ message, retryable: true });

      const reserve = Effect.fn("DmDispatchService.reserve")(function* (
        input: SendDmOnceInput
      ): Effect.fn.Return<Reservation, DmDispatchError> {
        return yield* sql
          .withTransaction(
            Effect.gen(function* () {
              const claimed = yield* sql<{ status: string }>`
                INSERT INTO automation_dm_dispatches
                  (provider, event_id, automation_id, platform_user_id, step_id, status)
                VALUES
                  (${input.provider}, ${input.eventId}, ${input.automationId}, ${input.recipientId}, ${input.stepId}, 'reserved')
                ON CONFLICT (provider, event_id, automation_id, platform_user_id, step_id)
                DO UPDATE SET status = 'reserved', error = NULL, failure_state = NULL
                WHERE (automation_dm_dispatches.status = 'failed'
                    AND automation_dm_dispatches.failure_state = 'not_sent')
                  OR (automation_dm_dispatches.status = 'reserved'
                    AND automation_dm_dispatches.updated_at < now() - interval '5 minutes')
                RETURNING status`;
              if (!claimed[0]) {
                const existing = yield* sql<{ status: string }>`SELECT status
                  FROM automation_dm_dispatches
                  WHERE provider = ${input.provider} AND event_id = ${input.eventId}
                    AND automation_id = ${input.automationId}
                    AND platform_user_id = ${input.recipientId}
                    AND step_id = ${input.stepId}`;
                if (existing[0]?.status === "reserved") {
                  return yield* new DmDispatchError({
                    message: "DM delivery is already in progress",
                    retryable: true,
                  });
                }
                return { _tag: "Duplicate" } as const;
              }

              const community = yield* entitlements.isCommunity;
              const rows = community
                ? yield* sql<{
                    billingOwnerUserId: string;
                    plan: string | null;
                  }>`SELECT w.billing_owner_user_id, NULL::text AS plan
                  FROM automations a
                  JOIN workspaces w ON w.id = a.workspace_id
                  WHERE a.id = ${input.automationId}`
                : yield* sql<{
                    billingOwnerUserId: string;
                    plan: string;
                  }>`SELECT w.billing_owner_user_id, s.plan
                  FROM automations a
                  JOIN workspaces w ON w.id = a.workspace_id
                  JOIN subscriptions s ON s.billing_owner_user_id = w.billing_owner_user_id
                  WHERE a.id = ${input.automationId}
                  FOR UPDATE OF s`;
              const quota = rows[0];
              if (!quota) {
                return yield* persistenceError(
                  "Automation quota owner is missing"
                );
              }

              if (community) {
                return {
                  _tag: "Reserved",
                  billingOwnerUserId: quota.billingOwnerUserId,
                } as const;
              }

              yield* sql`UPDATE subscriptions
                SET dms_sent = 0, dms_skipped = 0, dms_reserved = 0,
                    dms_sent_period_start = date_trunc('month', now())
                WHERE billing_owner_user_id = ${quota.billingOwnerUserId}
                  AND (dms_sent_period_start IS NULL
                    OR dms_sent_period_start < date_trunc('month', now()))`;
              const usage = yield* sql<{ sent: string; reserved: string }>`
                SELECT dms_sent::text AS sent, dms_reserved::text AS reserved
                FROM subscriptions
                WHERE billing_owner_user_id = ${quota.billingOwnerUserId}`;
              const current =
                Number(usage[0]?.sent ?? 0) + Number(usage[0]?.reserved ?? 0);
              const limit = getPlanLimits(quota.plan).dmsPerMonth;
              const softLimit = dmSoftLimit(limit);
              if (softLimit !== -1 && current >= softLimit) {
                yield* sql`UPDATE subscriptions SET dms_skipped = dms_skipped + 1
                  WHERE billing_owner_user_id = ${quota.billingOwnerUserId}`;
                yield* sql`UPDATE automation_dm_dispatches SET status = 'skipped'
                  WHERE provider = ${input.provider} AND event_id = ${input.eventId}
                    AND automation_id = ${input.automationId}
                    AND platform_user_id = ${input.recipientId}
                    AND step_id = ${input.stepId}`;
                return { _tag: "Skipped" } as const;
              }
              yield* sql`UPDATE subscriptions SET dms_reserved = dms_reserved + 1
                WHERE billing_owner_user_id = ${quota.billingOwnerUserId}`;
              return {
                _tag: "Reserved",
                billingOwnerUserId: quota.billingOwnerUserId,
              } as const;
            })
          )
          .pipe(Effect.mapError(() => persistenceError()));
      });

      const recordFailure = Effect.fn("DmDispatchService.recordFailure")(
        function* (
          input: SendDmOnceInput,
          billingOwnerUserId: string,
          failure: ProviderDmError
        ) {
          yield* sql
            .withTransaction(
              Effect.gen(function* () {
                yield* failure.deliveryState === "unknown"
                  ? sql`UPDATE subscriptions
                      SET dms_reserved = greatest(0, dms_reserved - 1),
                          dms_sent = dms_sent + 1
                      WHERE billing_owner_user_id = ${billingOwnerUserId}`
                  : sql`UPDATE subscriptions
                      SET dms_reserved = greatest(0, dms_reserved - 1)
                      WHERE billing_owner_user_id = ${billingOwnerUserId}`;
                yield* sql`UPDATE automation_dm_dispatches
                  SET status = ${failure.deliveryState === "unknown" ? "ambiguous" : "failed"},
                      failure_state = ${failure.deliveryState}, error = ${failure.message}
                  WHERE provider = ${input.provider} AND event_id = ${input.eventId}
                    AND automation_id = ${input.automationId}
                    AND platform_user_id = ${input.recipientId}
                    AND step_id = ${input.stepId}`;
              })
            )
            .pipe(
              Effect.mapError(() =>
                persistenceError("Unable to record provider failure")
              )
            );
        }
      );

      const sendOnce = Effect.fn("DmDispatchService.sendOnce")(function* (
        input: SendDmOnceInput
      ) {
        const reservation = yield* reserve(input);
        if (reservation._tag === "Duplicate") {
          return { _tag: "Duplicate" } as const;
        }
        if (reservation._tag === "Skipped") {
          return { _tag: "Skipped", reason: "quota" } as const;
        }
        const idempotencyKey = [
          input.provider,
          input.eventId,
          input.automationId,
          input.recipientId,
          input.stepId,
        ].join(":");
        const result = yield* provider
          .send({ ...input, idempotencyKey })
          .pipe(Effect.result);
        if (result._tag === "Failure") {
          yield* recordFailure(
            input,
            reservation.billingOwnerUserId,
            result.failure
          );
          return yield* result.failure;
        }
        yield* sql
          .withTransaction(
            Effect.gen(function* () {
              yield* sql`UPDATE subscriptions
                SET dms_reserved = greatest(0, dms_reserved - 1),
                    dms_sent = dms_sent + 1
                WHERE billing_owner_user_id = ${reservation.billingOwnerUserId}`;
              yield* sql`UPDATE automation_dm_dispatches
                SET status = 'sent', provider_message_id = ${result.success.messageId}
                WHERE provider = ${input.provider} AND event_id = ${input.eventId}
                  AND automation_id = ${input.automationId}
                  AND platform_user_id = ${input.recipientId}
                  AND step_id = ${input.stepId}`;
              yield* sql`UPDATE automations
                SET total_triggered = total_triggered + 1,
                    total_dms_sent = total_dms_sent + 1
                WHERE id = ${input.automationId}`;
            })
          )
          .pipe(
            Effect.mapError(() =>
              persistenceError(
                "DM was sent but its receipt could not be recorded"
              )
            )
          );
        return { _tag: "Sent", messageId: result.success.messageId } as const;
      });
      return DmDispatchService.of({ sendOnce });
    })
  );
}
