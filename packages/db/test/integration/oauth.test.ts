import {
  makeId,
  makeOAuthAuthorizationCodeRepository,
  makeOAuthClientRepository,
  makeOAuthGrantRepository,
  makeOAuthRefreshTokenRepository,
  makeUserRepository,
  OAuthAuthorizationCode,
  OAuthAuthorizationCodeId,
  OAuthClient,
  OAuthClientId,
  OAuthGrant,
  OAuthGrantId,
  OAuthRefreshToken,
  OAuthRefreshTokenId,
  User,
  UserId,
} from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import { DateTime, Effect, String as EffectString, Redacted } from "effect";
import { describe, expect, it } from "vitest";

const DatabaseLive = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

const nullable = null;

describe("OAuth AS model round trips", () => {
  it("round-trips a seeded client and the code/grant/refresh chain", async () => {
    const program = Effect.gen(function* () {
      // First-party clients are seeded by migration 0002.
      const clientRepo = yield* makeOAuthClientRepository();
      const cli = yield* clientRepo.findById(
        OAuthClientId.make("oauth_client_clidelulu001")
      );
      expect(cli?.clientId).toBe("delulu-cli");
      expect(cli?.firstParty).toBe(true);
      expect(cli?.redirectUris.length).toBeGreaterThan(0);

      const userRepo = yield* makeUserRepository();
      const user = yield* userRepo.insert(
        User.insert.make({
          id: makeId(UserId),
          legacyConvexId: nullable,
          externalId: `clerk_${crypto.randomUUID()}`,
          email: "as@example.com",
          name: "AS User",
          imageUrl: nullable,
          monthlyPosts: 0n,
          monthlyPostsPeriodStart: nullable,
          dmsSent: 0n,
          dmsSentPeriodStart: nullable,
          transcriptionsUsed: 0n,
          transcriptionsPeriodStart: nullable,
        })
      );

      const codeRepo = yield* makeOAuthAuthorizationCodeRepository();
      const code = yield* codeRepo.insert(
        OAuthAuthorizationCode.insert.make({
          id: makeId(OAuthAuthorizationCodeId),
          legacyConvexId: nullable,
          codeHash: crypto.randomUUID(),
          clientId: "delulu-cli",
          userId: user.id,
          scopes: ["posts:read", "posts:write"],
          codeChallenge: "challenge",
          codeChallengeMethod: "S256",
          redirectUri: "http://127.0.0.1/callback",
          resource: "https://api.delulu.social",
          expiresAt: DateTime.nowUnsafe(),
          consumedAt: nullable,
        })
      );

      const grantRepo = yield* makeOAuthGrantRepository();
      const grant = yield* grantRepo.insert(
        OAuthGrant.insert.make({
          id: makeId(OAuthGrantId),
          legacyConvexId: nullable,
          userId: user.id,
          clientId: "delulu-cli",
          scopes: ["posts:read", "posts:write"],
          revokedAt: nullable,
        })
      );

      const refreshRepo = yield* makeOAuthRefreshTokenRepository();
      const refresh = yield* refreshRepo.insert(
        OAuthRefreshToken.insert.make({
          id: makeId(OAuthRefreshTokenId),
          legacyConvexId: nullable,
          tokenHash: crypto.randomUUID(),
          grantId: grant.id,
          userId: user.id,
          clientId: "delulu-cli",
          scopes: ["posts:read", "posts:write"],
          resource: "https://api.delulu.social",
          familyId: crypto.randomUUID(),
          rotatedFrom: nullable,
          expiresAt: DateTime.nowUnsafe(),
          revokedAt: nullable,
        })
      );

      return {
        code: yield* codeRepo.findById(code.id),
        grant: yield* grantRepo.findById(grant.id),
        refresh: yield* refreshRepo.findById(refresh.id),
      };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(DatabaseLive))
    );
    expect(result.code.scopes).toEqual(["posts:read", "posts:write"]);
    expect(result.grant.clientId).toBe("delulu-cli");
    expect(result.refresh.resource).toBe("https://api.delulu.social");
  });
});
