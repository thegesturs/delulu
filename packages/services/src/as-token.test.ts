import { Effect, Layer } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { AsTokenService } from "./as-token";
import { AuthConfig } from "./config";

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

const ISSUER = "https://api.delulu.test";
const RESOURCE = "https://api.delulu.test";

let layer: Layer.Layer<AsTokenService>;

beforeAll(async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const config = Layer.succeed(
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
  layer = AsTokenService.layer.pipe(Layer.provide(config));
});

describe("AsTokenService (ES256)", () => {
  it("issues and verifies an access token with sub/scope/aud", async () => {
    const program = Effect.gen(function* () {
      const service = yield* AsTokenService;
      const issued = yield* service.issueAccessToken({
        sub: "user_abc",
        scopes: ["posts:read", "media:write"],
        resource: RESOURCE,
      });
      const claims = yield* service.verifyAccessToken(issued.token);
      return { issued, claims };
    });
    const { issued, claims } = await Effect.runPromise(
      program.pipe(Effect.provide(layer))
    );
    expect(issued.expiresInSeconds).toBe(15 * 60);
    expect(claims.sub).toBe("user_abc");
    expect(claims.aud).toBe(RESOURCE);
    expect([...claims.scopes].sort()).toEqual(["media:write", "posts:read"]);
  });

  it("defaults the audience to the API resource when none is requested", async () => {
    const program = Effect.gen(function* () {
      const service = yield* AsTokenService;
      const issued = yield* service.issueAccessToken({
        sub: "user_abc",
        scopes: ["posts:read"],
        resource: "",
      });
      return yield* service.verifyAccessToken(issued.token);
    });
    const claims = await Effect.runPromise(program.pipe(Effect.provide(layer)));
    expect(claims.aud).toBe(RESOURCE);
  });

  it("round-trips a workspace binding via the wid claim", async () => {
    const program = Effect.gen(function* () {
      const service = yield* AsTokenService;
      const bound = yield* service.issueAccessToken({
        sub: "user_abc",
        scopes: ["posts:read"],
        resource: RESOURCE,
        workspaceId: "workspace_abc123def456",
      });
      const unbound = yield* service.issueAccessToken({
        sub: "user_abc",
        scopes: ["posts:read"],
        resource: RESOURCE,
      });
      return {
        bound: yield* service.verifyAccessToken(bound.token),
        unbound: yield* service.verifyAccessToken(unbound.token),
      };
    });
    const { bound, unbound } = await Effect.runPromise(
      program.pipe(Effect.provide(layer))
    );
    expect(bound.workspaceId).toBe("workspace_abc123def456");
    expect(unbound.workspaceId).toBe(null);
  });

  it("rejects a token whose audience does not match the API resource", async () => {
    const program = Effect.gen(function* () {
      const service = yield* AsTokenService;
      const issued = yield* service.issueAccessToken({
        sub: "user_abc",
        scopes: ["posts:read"],
        resource: "https://someone-elses-api.test",
      });
      return yield* service.verifyAccessToken(issued.token).pipe(Effect.flip);
    });
    const error = await Effect.runPromise(program.pipe(Effect.provide(layer)));
    expect(error._tag).toBe("UnauthorizedError");
  });

  it("rejects a tampered token", async () => {
    const program = Effect.gen(function* () {
      const service = yield* AsTokenService;
      const issued = yield* service.issueAccessToken({
        sub: "user_abc",
        scopes: ["posts:read"],
        resource: RESOURCE,
      });
      const tampered = `${issued.token.slice(0, -4)}AAAA`;
      return yield* service.verifyAccessToken(tampered).pipe(Effect.flip);
    });
    const error = await Effect.runPromise(program.pipe(Effect.provide(layer)));
    expect(error._tag).toBe("UnauthorizedError");
  });

  it("publishes a JWKS with the signing key id and ES256 alg", async () => {
    const program = Effect.gen(function* () {
      const service = yield* AsTokenService;
      return yield* service.jwks();
    });
    const jwks = await Effect.runPromise(program.pipe(Effect.provide(layer)));
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0]).toMatchObject({
      kid: "test-kid",
      alg: "ES256",
      use: "sig",
    });
  });
});
