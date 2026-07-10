import { ApiKey, ApiKeyId, makeApiKeyRepository, makeId } from "@delulu/core";
import {
  ApiKeyVerifier,
  AsTokenService,
  AuthConfig,
  deriveChallengeS256,
  generateApiKey,
  IdentityService,
  MembershipService,
  OAuthFlowService,
} from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import {
  Effect,
  String as EffectString,
  Layer,
  Option,
  Redacted,
} from "effect";
import { beforeAll, describe, expect, it } from "vitest";

const ISSUER = "https://api.delulu.test";
const RESOURCE = "https://api.delulu.test";

const toPem = (der: ArrayBuffer): string => {
  const bytes = new Uint8Array(der);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const b64 =
    btoa(binary)
      .match(/.{1,64}/g)
      ?.join("\n") ?? "";
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
};

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

let AppLayer: Layer.Layer<
  | IdentityService
  | MembershipService
  | ApiKeyVerifier
  | OAuthFlowService
  | AsTokenService
  | PgClient.PgClient
>;

beforeAll(async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const Config = Layer.succeed(
    AuthConfig,
    AuthConfig.of({
      clerkIssuer: "",
      clerkJwtKey: "",
      asIssuer: ISSUER,
      apiResource: RESOURCE,
      appBaseUrl: "https://app.delulu.test",
      asSigningKeyPem: toPem(pkcs8),
      asSigningKid: "test-kid",
    })
  );
  const AsToken = AsTokenService.layer.pipe(Layer.provide(Config));
  AppLayer = Layer.mergeAll(
    IdentityService.layer,
    MembershipService.layer,
    ApiKeyVerifier.layer,
    OAuthFlowService.layer,
    AsToken
  ).pipe(Layer.provide(AsToken), Layer.provideMerge(Pg));
});

describe("IdentityService JIT provisioning", () => {
  it("provisions user + personal workspace once, idempotently", async () => {
    const sub = `clerk_${crypto.randomUUID()}`;
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const first = yield* identity.resolve({ sub, email: "jit@example.com" });
      const second = yield* identity.resolve({ sub });
      return { first, second };
    });
    const { first, second } = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(first.user.id).toBe(second.user.id);
    expect(first.personalWorkspace?.id).toBe(second.personalWorkspace?.id);
    expect(first.personalWorkspace?.isPersonal).toBe(true);
  });
});

describe("MembershipService", () => {
  it("resolves the live owner role for a provisioned workspace", async () => {
    const sub = `clerk_${crypto.randomUUID()}`;
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const membership = yield* MembershipService;
      const resolved = yield* identity.resolve({ sub });
      const role = yield* membership.resolve({
        workspaceId: resolved.personalWorkspace?.id ?? "",
        userId: resolved.user.id,
      });
      return role;
    });
    const role = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(Option.isSome(role)).toBe(true);
    expect(Option.getOrNull(role)?.role).toBe("owner");
  });
});

describe("ApiKeyVerifier", () => {
  it("verifies a seeded key and returns its frozen role + scopes", async () => {
    const sub = `clerk_${crypto.randomUUID()}`;
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const membership = yield* MembershipService;
      const verifier = yield* ApiKeyVerifier;
      const keyRepo = yield* makeApiKeyRepository();

      const resolved = yield* identity.resolve({ sub });
      const workspaceId = resolved.personalWorkspace?.id ?? "";
      const member = yield* membership.resolve({
        workspaceId,
        userId: resolved.user.id,
      });
      const memberId = Option.getOrThrow(member).memberId;

      const generated = yield* Effect.promise(() => generateApiKey());
      yield* keyRepo.insert(
        ApiKey.insert.make({
          id: makeId(ApiKeyId),
          legacyConvexId: null,
          workspaceId: workspaceId as ApiKey["workspaceId"],
          createdByMemberId: memberId,
          name: "bot",
          keyPrefix: generated.prefix,
          keyHash: generated.hash,
          role: "editor",
          scopes: ["posts:read", "posts:write"],
          lastUsedAt: null,
          expiresAt: null,
          revokedAt: null,
        })
      );

      const good = yield* verifier.verify(generated.token);
      const bad = yield* verifier.verify(`dsk_${"x".repeat(36)}`);
      return { good, bad, workspaceId };
    });
    const { good, bad, workspaceId } = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(Option.isNone(bad)).toBe(true);
    const verified = Option.getOrThrow(good);
    expect(verified.role).toBe("editor");
    expect(verified.workspaceId).toBe(workspaceId);
    expect([...verified.scopes].sort()).toEqual(["posts:read", "posts:write"]);
  });
});

describe("OAuth 2.1 authorization-code flow", () => {
  it("issues a code, exchanges it, rotates refresh, and revokes the family on reuse", async () => {
    const sub = `clerk_${crypto.randomUUID()}`;
    const verifier = "verifier-1234567890-abcdefghijklmnop";
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const flow = yield* OAuthFlowService;
      const tokens = yield* AsTokenService;
      const resolved = yield* identity.resolve({ sub });

      const challenge = yield* Effect.promise(() =>
        deriveChallengeS256(verifier)
      );
      // Registered redirect is port-less loopback; a real CLI uses a random port.
      const redirectUri = "http://127.0.0.1:54321/callback";
      const issued = yield* flow.issueCode({
        clientId: "delulu-cli",
        userId: resolved.user.id,
        redirectUri,
        scopes: ["posts:read"],
        codeChallenge: challenge,
        codeChallengeMethod: "S256",
        resource: RESOURCE,
      });

      const first = yield* flow.exchangeCode({
        code: issued.code,
        clientId: "delulu-cli",
        redirectUri,
        codeVerifier: verifier,
      });
      const claims = yield* tokens.verifyAccessToken(first.access_token);

      const rotated = yield* flow.refresh({
        refreshToken: first.refresh_token,
        clientId: "delulu-cli",
      });

      // Presenting the now-rotated (old) refresh token again is reuse.
      const reuse = yield* flow
        .refresh({ refreshToken: first.refresh_token, clientId: "delulu-cli" })
        .pipe(Effect.flip);

      // The whole family — including the freshly rotated token — is dead.
      const afterFamilyRevoke = yield* flow
        .refresh({
          refreshToken: rotated.refresh_token,
          clientId: "delulu-cli",
        })
        .pipe(Effect.flip);

      return {
        claims,
        first,
        rotated,
        reuse,
        afterFamilyRevoke,
        userId: resolved.user.id,
      };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(result.claims.sub).toBe(result.userId);
    expect(result.claims.scopes).toContain("posts:read");
    expect(result.rotated.refresh_token).not.toBe(result.first.refresh_token);
    expect(result.reuse.error).toBe("invalid_grant");
    expect(result.afterFamilyRevoke.error).toBe("invalid_grant");
  });

  it("rejects an unregistered redirect_uri", async () => {
    const sub = `clerk_${crypto.randomUUID()}`;
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const flow = yield* OAuthFlowService;
      const resolved = yield* identity.resolve({ sub });
      return yield* flow
        .issueCode({
          clientId: "delulu-cli",
          userId: resolved.user.id,
          redirectUri: "https://evil.example.com/callback",
          scopes: ["posts:read"],
          codeChallenge: "challenge",
          codeChallengeMethod: "S256",
          resource: RESOURCE,
        })
        .pipe(Effect.flip);
    });
    const error = await Effect.runPromise(
      program.pipe(Effect.provide(AppLayer))
    );
    expect(error.error).toBe("invalid_request");
  });
});
