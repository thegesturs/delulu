import { NotFoundError } from "@delulu/contracts";
import { makeId, TranscriptionId } from "@delulu/core";
import { SORTED_LIMITS } from "@delulu/payments/product-ids";
import { Context, DateTime, Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";

export interface TranscriptionRecord {
  readonly id: string;
  readonly reelId: string;
  readonly reelUrl: string;
  readonly text: string;
  readonly altText?: string;
  readonly language: string;
  readonly durationSeconds: number;
  readonly createdAt: number;
}

export interface TranscriptionUsage {
  readonly used: number;
  readonly limit: number;
  readonly periodEnd: number;
  readonly isSortedActive: boolean;
  readonly isSubscribed: boolean;
  readonly paidSoftLimit: number;
  readonly paidHardLimit: number;
  readonly dodoCustomerId: string | null;
}

const toRecord = (row: Record<string, unknown>): TranscriptionRecord => ({
  id: String(row.id),
  reelId: String(row.reelId),
  reelUrl: String(row.reelUrl),
  text: String(row.text),
  ...(row.altText ? { altText: String(row.altText) } : {}),
  language: String(row.language ?? "unknown"),
  durationSeconds: Number(row.durationSeconds ?? 0),
  createdAt: (row.createdAt as Date).getTime(),
});

export class TranscriptionService extends Context.Service<
  TranscriptionService,
  {
    readonly getByReelId: (input: {
      readonly externalUserId: string;
      readonly reelId: string;
    }) => Effect.Effect<
      (TranscriptionRecord & { readonly isOwnCache: boolean }) | null,
      NotFoundError
    >;
    readonly create: (input: {
      readonly externalUserId: string;
      readonly reelId: string;
      readonly reelUrl: string;
      readonly text: string;
      readonly altText?: string;
      readonly language: string;
      readonly durationSeconds: number;
    }) => Effect.Effect<TranscriptionRecord, NotFoundError>;
    readonly createAndIncrement: (input: {
      readonly externalUserId: string;
      readonly reelId: string;
      readonly reelUrl: string;
      readonly text: string;
      readonly altText?: string;
      readonly language: string;
      readonly durationSeconds: number;
    }) => Effect.Effect<
      {
        readonly record: TranscriptionRecord | null;
        readonly usage: TranscriptionUsage;
      },
      NotFoundError
    >;
    readonly usage: (
      externalUserId: string
    ) => Effect.Effect<TranscriptionUsage, NotFoundError>;
    readonly incrementUsage: (
      externalUserId: string
    ) => Effect.Effect<number, NotFoundError>;
    readonly list: (input: {
      readonly userId: string;
      readonly limit: number;
      readonly cursor?: string;
    }) => Effect.Effect<
      {
        readonly page: readonly TranscriptionRecord[];
        readonly continueCursor: string;
        readonly isDone: boolean;
      },
      NotFoundError
    >;
    readonly usageByUserId: (
      userId: string
    ) => Effect.Effect<TranscriptionUsage, NotFoundError>;
  }
>()("@delulu/services/TranscriptionService") {
  static readonly layer = Layer.effect(
    TranscriptionService,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const userContext = Effect.fn("TranscriptionService.userContext")(
        function* (column: "id" | "external_id", value: string) {
          const rows = yield* sql<Record<string, unknown>>`
            SELECT u.id AS user_id, w.id AS workspace_id,
              s.transcriptions_used, s.transcriptions_period_start,
              s.addons, s.provider_customer_id
            FROM users u
            JOIN workspaces w ON w.billing_owner_user_id = u.id AND w.is_personal = true
              AND w.deleted_at IS NULL
            JOIN subscriptions s ON s.billing_owner_user_id = w.billing_owner_user_id
            WHERE (${column} = 'id' AND u.id = ${value})
               OR (${column} = 'external_id' AND u.external_id = ${value})
            ORDER BY w.created_at LIMIT 1`.pipe(Effect.orDie);
          const row = rows[0];
          if (!row) {
            return yield* new NotFoundError({
              message: "User subscription context not found",
              resource: "user",
            });
          }
          return row;
        }
      );

      const usageFrom = (row: Record<string, unknown>): TranscriptionUsage => {
        const now = Date.now();
        const transcriptionStart = row.transcriptionsPeriodStart as Date | null;
        const periodEnd =
          (transcriptionStart?.getTime() ?? now) + SORTED_LIMITS.PERIOD_MS;
        const expired = periodEnd <= now;
        const addons = (row.addons ?? {}) as Record<string, unknown>;
        const sorted = addons.sorted;
        const isSortedActive =
          sorted === true ||
          (typeof sorted === "object" &&
            sorted !== null &&
            "status" in sorted &&
            (sorted as { readonly status?: unknown }).status === "active");
        return {
          used: expired ? 0 : Number(row.transcriptionsUsed ?? 0),
          limit: SORTED_LIMITS.FREE_TRANSCRIPTION_LIMIT,
          periodEnd,
          isSortedActive,
          isSubscribed: isSortedActive,
          paidSoftLimit: SORTED_LIMITS.PAID_TRANSCRIPTION_SOFT_LIMIT,
          paidHardLimit: SORTED_LIMITS.PAID_TRANSCRIPTION_HARD_LIMIT,
          dodoCustomerId: row.providerCustomerId
            ? String(row.providerCustomerId)
            : null,
        };
      };

      const usage = Effect.fn("TranscriptionService.usage")(function* (
        externalUserId: string
      ) {
        return usageFrom(yield* userContext("external_id", externalUserId));
      });
      const usageByUserId = Effect.fn("TranscriptionService.usageByUserId")(
        function* (userId: string) {
          return usageFrom(yield* userContext("id", userId));
        }
      );

      const getByReelId = Effect.fn("TranscriptionService.getByReelId")(
        function* (input: {
          readonly externalUserId: string;
          readonly reelId: string;
        }) {
          const context = yield* userContext(
            "external_id",
            input.externalUserId
          );
          const rows = yield* sql<Record<string, unknown>>`
            SELECT id, workspace_id, reel_id, reel_url, text, alt_text,
              language, duration_seconds, created_at
            FROM transcriptions WHERE reel_id = ${input.reelId}
            ORDER BY created_at LIMIT 1`.pipe(Effect.orDie);
          return rows[0]
            ? {
                ...toRecord(rows[0]),
                isOwnCache: rows[0].workspaceId === context.workspaceId,
              }
            : null;
        }
      );

      const create = Effect.fn("TranscriptionService.create")(
        function* (input: {
          readonly externalUserId: string;
          readonly reelId: string;
          readonly reelUrl: string;
          readonly text: string;
          readonly altText?: string;
          readonly language: string;
          readonly durationSeconds: number;
        }) {
          const context = yield* userContext(
            "external_id",
            input.externalUserId
          );
          const rows = yield* sql<Record<string, unknown>>`
            INSERT INTO transcriptions
              (id, workspace_id, reel_id, reel_url, text, alt_text, language, duration_seconds)
            VALUES (${makeId(TranscriptionId)}, ${String(context.workspaceId)}, ${input.reelId},
              ${input.reelUrl}, ${input.text}, ${input.altText ?? null}, ${input.language},
              ${input.durationSeconds})
            ON CONFLICT (workspace_id, reel_id) WHERE reel_id IS NOT NULL
            DO UPDATE SET reel_url = EXCLUDED.reel_url
            RETURNING id, reel_id, reel_url, text, alt_text, language,
              duration_seconds, created_at`.pipe(Effect.orDie);
          return toRecord(rows[0] as Record<string, unknown>);
        }
      );

      const incrementUsage = Effect.fn("TranscriptionService.incrementUsage")(
        function* (externalUserId: string) {
          const context = yield* userContext("external_id", externalUserId);
          const rows = yield* sql
            .withTransaction(
              sql<{ transcriptionsUsed: string }>`
              UPDATE subscriptions SET
                transcriptions_used = CASE
                  WHEN COALESCE(current_period_end,
                    transcriptions_period_start + interval '30 days') <= now() THEN 1
                  ELSE transcriptions_used + 1 END,
                transcriptions_period_start = CASE
                  WHEN transcriptions_period_start IS NULL
                    OR transcriptions_period_start + interval '30 days' <= now()
                  THEN now() ELSE transcriptions_period_start END
              WHERE billing_owner_user_id = ${String(context.userId)}
              RETURNING transcriptions_used::text AS transcriptions_used`
            )
            .pipe(Effect.orDie);
          return Number(rows[0]?.transcriptionsUsed ?? 0);
        }
      );

      const createAndIncrement = Effect.fn(
        "TranscriptionService.createAndIncrement"
      )(function* (input: {
        readonly externalUserId: string;
        readonly reelId: string;
        readonly reelUrl: string;
        readonly text: string;
        readonly altText?: string;
        readonly language: string;
        readonly durationSeconds: number;
      }) {
        const result = yield* sql
          .withTransaction(
            Effect.gen(function* () {
              const contexts = yield* sql<Record<string, unknown>>`
              SELECT u.id AS user_id, w.id AS workspace_id,
                s.transcriptions_used, s.transcriptions_period_start, s.addons,
                s.provider_customer_id
              FROM users u
              JOIN workspaces w ON w.billing_owner_user_id = u.id
                AND w.is_personal = true AND w.deleted_at IS NULL
              JOIN subscriptions s ON s.billing_owner_user_id = u.id
              WHERE u.external_id = ${input.externalUserId}
              ORDER BY w.created_at LIMIT 1 FOR UPDATE OF s`;
              const context = contexts[0];
              if (!context) {
                return yield* new NotFoundError({
                  message: "User subscription context not found",
                  resource: "user",
                });
              }
              const currentUsage = usageFrom(context);
              const limit = currentUsage.isSortedActive
                ? SORTED_LIMITS.PAID_TRANSCRIPTION_HARD_LIMIT
                : SORTED_LIMITS.FREE_TRANSCRIPTION_LIMIT;
              if (currentUsage.used >= limit) {
                return { record: null, usage: currentUsage };
              }
              const inserted = yield* sql<Record<string, unknown>>`
              INSERT INTO transcriptions
                (id, workspace_id, reel_id, reel_url, text, alt_text, language, duration_seconds)
              VALUES (${makeId(TranscriptionId)}, ${String(context.workspaceId)},
                ${input.reelId}, ${input.reelUrl}, ${input.text}, ${input.altText ?? null},
                ${input.language}, ${input.durationSeconds})
              ON CONFLICT (workspace_id, reel_id) WHERE reel_id IS NOT NULL DO NOTHING
              RETURNING id, reel_id, reel_url, text, alt_text, language,
                duration_seconds, created_at`;
              if (!inserted[0]) {
                const existing = yield* sql<Record<string, unknown>>`
                SELECT id, reel_id, reel_url, text, alt_text, language,
                  duration_seconds, created_at FROM transcriptions
                WHERE workspace_id = ${String(context.workspaceId)}
                  AND reel_id = ${input.reelId}`;
                return {
                  record: toRecord(existing[0] as Record<string, unknown>),
                  usage: currentUsage,
                };
              }
              const updated = yield* sql<Record<string, unknown>>`
              UPDATE subscriptions SET
                transcriptions_used = CASE
                  WHEN transcriptions_period_start + interval '30 days' <= now() THEN 1
                  ELSE transcriptions_used + 1 END,
                transcriptions_period_start = CASE
                  WHEN transcriptions_period_start IS NULL
                    OR transcriptions_period_start + interval '30 days' <= now()
                  THEN now() ELSE transcriptions_period_start END
              WHERE billing_owner_user_id = ${String(context.userId)}
              RETURNING transcriptions_used, transcriptions_period_start,
                addons, provider_customer_id`;
              return {
                record: toRecord(inserted[0]),
                usage: usageFrom(updated[0] as Record<string, unknown>),
              };
            })
          )
          .pipe(Effect.catchTag("SqlError", Effect.die));
        return result;
      });

      const list = Effect.fn("TranscriptionService.list")(function* (input: {
        readonly userId: string;
        readonly limit: number;
        readonly cursor?: string;
      }) {
        const context = yield* userContext("id", input.userId);
        const offset = Math.max(
          0,
          Number.parseInt(input.cursor ?? "0", 10) || 0
        );
        const rows = yield* sql<Record<string, unknown>>`
            SELECT id, reel_id, reel_url, text, alt_text, language, duration_seconds, created_at
            FROM transcriptions WHERE workspace_id = ${String(context.workspaceId)}
              AND reel_id IS NOT NULL AND reel_url IS NOT NULL
            ORDER BY created_at DESC, id DESC LIMIT ${input.limit + 1} OFFSET ${offset}`.pipe(
          Effect.orDie
        );
        const isDone = rows.length <= input.limit;
        return {
          page: rows.slice(0, input.limit).map(toRecord),
          continueCursor: String(offset + Math.min(rows.length, input.limit)),
          isDone,
        };
      });

      return TranscriptionService.of({
        getByReelId,
        create,
        createAndIncrement,
        usage,
        incrementUsage,
        list,
        usageByUserId,
      });
    })
  );
}
