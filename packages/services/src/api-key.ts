import {
  ApiKeyId,
  Scope,
  UserId,
  WorkspaceId,
  WorkspaceRole,
} from "@delulu/core";
import { Context, DateTime, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import { hashApiKey, parseApiKey } from "./api-key-format";
import { timingSafeEqual } from "./crypto";

export interface VerifiedApiKey {
  readonly apiKeyId: ApiKeyId;
  readonly workspaceId: WorkspaceId;
  readonly role: WorkspaceRole;
  readonly scopes: readonly Scope[];
  /** The identity the key acts as (its creator's user), for `sub`. */
  readonly userId: UserId;
}

/** Only the columns the verifier needs, joined to the creator's user id. */
const ApiKeyLookup = Schema.Struct({
  id: ApiKeyId,
  workspaceId: WorkspaceId,
  keyHash: Schema.String,
  role: WorkspaceRole,
  scopes: Schema.Array(Scope),
  createdByUserId: UserId,
  revokedAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
  expiresAt: Schema.NullOr(Schema.DateTimeUtcFromDate),
});

/**
 * Verifies a presented `dsk_…` API key against `api_keys`: indexed prefix
 * lookup, constant-time hash compare, revocation/expiry checks. Returns the
 * frozen role + scopes + workspace binding. `touch` updates `last_used_at`
 * out-of-band (the worker fires it via `ctx.waitUntil`).
 */
export class ApiKeyVerifier extends Context.Service<
  ApiKeyVerifier,
  {
    readonly verify: (
      token: string
    ) => Effect.Effect<Option.Option<VerifiedApiKey>>;
    readonly touch: (apiKeyId: ApiKeyId) => Effect.Effect<void>;
  }
>()("@delulu/services/ApiKeyVerifier") {
  static readonly layer = Layer.effect(
    ApiKeyVerifier,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const findByPrefix = SqlSchema.findOneOption({
        Request: Schema.String,
        Result: ApiKeyLookup,
        execute: (prefix) =>
          sql`SELECT k.id, k.workspace_id, k.key_hash, k.role, k.scopes, k.revoked_at, k.expires_at, m.user_id AS created_by_user_id
              FROM api_keys k
              JOIN workspace_members m ON m.id = k.created_by_member_id
              WHERE k.key_prefix = ${prefix}`,
      });

      const verify = (token: string) =>
        Effect.gen(function* () {
          const parsed = parseApiKey(token);
          if (parsed === null) {
            return Option.none<VerifiedApiKey>();
          }
          const maybeKey = yield* findByPrefix(parsed.prefix).pipe(
            Effect.orDie
          );
          if (Option.isNone(maybeKey)) {
            return Option.none<VerifiedApiKey>();
          }
          const key = maybeKey.value;
          const presentedHash = yield* Effect.promise(() => hashApiKey(token));
          if (!timingSafeEqual(presentedHash, key.keyHash)) {
            return Option.none<VerifiedApiKey>();
          }
          if (key.revokedAt !== null) {
            return Option.none<VerifiedApiKey>();
          }
          const now = yield* DateTime.now;
          if (
            key.expiresAt !== null &&
            DateTime.isLessThan(key.expiresAt, now)
          ) {
            return Option.none<VerifiedApiKey>();
          }
          return Option.some<VerifiedApiKey>({
            apiKeyId: key.id,
            workspaceId: key.workspaceId,
            role: key.role,
            scopes: key.scopes,
            userId: key.createdByUserId,
          });
        });

      const touch = (apiKeyId: ApiKeyId) =>
        sql`UPDATE api_keys SET last_used_at = now() WHERE id = ${apiKeyId}`.pipe(
          Effect.asVoid,
          Effect.ignore
        );

      return ApiKeyVerifier.of({ verify, touch });
    })
  );
}
