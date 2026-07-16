import { Authentication, UnauthorizedError } from "@delulu/contracts";
import {
  type AuthContext,
  CurrentAuth,
  CurrentUser,
  type UserId,
  type WorkspaceId,
} from "@delulu/core";
import {
  ApiKeyVerifier,
  AsTokenService,
  AuthConfig,
  ClerkTokenVerifier,
  classifyBearer,
  EntitlementPolicy,
  IdentityService,
  RateLimiterService,
  type RateTier,
} from "@delulu/services";
import { Effect, Layer, Option, Redacted, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

/**
 * The Authentication middleware implementation: bearer dispatch → the matching
 * verifier → identity resolution → per-credential rate limit → provide
 * `CurrentAuth`/`CurrentUser`. Failures surface as 401 (auth) or 429 (rate).
 */
export const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const clerk = yield* ClerkTokenVerifier;
    const asTokens = yield* AsTokenService;
    const apiKeys = yield* ApiKeyVerifier;
    const identity = yield* IdentityService;
    const limiter = yield* RateLimiterService;
    const config = yield* AuthConfig;
    const entitlements = yield* EntitlementPolicy;

    // Resolve the plan's per-minute API rate for an API key's workspace.
    const planForWorkspace = SqlSchema.findOneOption({
      Request: Schema.String,
      Result: Schema.Struct({ plan: Schema.String }),
      execute: (workspaceId) =>
        sql`SELECT s.plan FROM workspaces w
            JOIN subscriptions s ON s.billing_owner_user_id = w.billing_owner_user_id
            WHERE w.id = ${workspaceId}`,
    });

    const apiTierFor = (workspaceId: string) =>
      planForWorkspace(workspaceId).pipe(
        Effect.map((row) => ({
          kind: "api" as const,
          perMinute: entitlements.apiRatePerMinute(Option.getOrNull(row)?.plan),
        })),
        Effect.orElseSucceed(() => ({
          kind: "api" as const,
          perMinute: entitlements.apiRatePerMinute(null),
        }))
      );

    return Authentication.of({
      bearer: Effect.fnUntraced(function* (httpEffect, { credential }) {
        const token = Redacted.value(credential);
        const kind = classifyBearer(token, config.asIssuer);

        let auth: AuthContext;
        let rateKey: string;
        let tier: RateTier;

        if (kind === "apiKey") {
          const verified = yield* apiKeys.verify(token);
          if (Option.isNone(verified)) {
            return yield* Effect.fail(
              new UnauthorizedError({ message: "Invalid API key" })
            );
          }
          const key = verified.value;
          auth = {
            userId: key.userId,
            credential: "apiKey",
            scopes: key.scopes,
            frozenRole: key.role,
            boundWorkspaceId: key.workspaceId,
            apiKeyId: key.apiKeyId,
          };
          rateKey = `apikey:${key.apiKeyId}`;
          tier = yield* apiTierFor(key.workspaceId);
          // Best-effort last_used_at touch (already error-swallowed).
          yield* apiKeys.touch(key.apiKeyId);
        } else if (kind === "oauth") {
          // Our AS tokens carry OUR internal user id as `sub` (we are the
          // issuer), so resolve by id — not by Clerk external id.
          const claims = yield* asTokens.verifyAccessToken(token);
          const resolved = yield* identity.resolveById(claims.sub);
          auth = {
            userId: resolved.user.id,
            credential: "oauth",
            scopes: claims.scopes,
            ...(claims.workspaceId
              ? { boundWorkspaceId: claims.workspaceId as WorkspaceId }
              : {}),
          };
          rateKey = `user:${resolved.user.id}`;
          tier = { kind: "session" };
        } else {
          const clerkId = yield* clerk.verify(token);
          const resolved = yield* identity.resolve({ sub: clerkId.sub });
          auth = {
            userId: resolved.user.id,
            credential: "session",
            scopes: "full",
          };
          rateKey = `user:${resolved.user.id}`;
          tier = { kind: "session" };
        }

        yield* limiter.limit(rateKey, tier);

        const userId: UserId = auth.userId;
        return yield* httpEffect.pipe(
          Effect.provideService(CurrentAuth, auth),
          Effect.provideService(CurrentUser, { id: userId })
        );
      }),
    });
  })
);
