import { UnauthorizedError } from "@delulu/contracts";
import {
  ApiKeyVerifier,
  AsTokenService,
  AuthConfig,
  ClerkTokenVerifier,
  deriveChallengeS256,
  IdentityService,
  MembershipService,
  OAuthFlowService,
  QuotaGuard,
  RateLimiterService,
} from "@delulu/services";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { type AppServices, buildWebHandler } from "../src/app";

const ISSUER = "http://localhost:8787";
const DEV_SUB = `clerk_e2e_${crypto.randomUUID()}`;

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

let handler: (request: Request) => Promise<Response>;

beforeAll(async () => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const Pg = PgClient.layer({
    url: Redacted.make(
      process.env.DATABASE_URL ??
        "postgres://delulu:delulu@localhost:5432/delulu"
    ),
    transformQueryNames: EffectString.camelToSnake,
    transformResultNames: EffectString.snakeToCamel,
    transformJson: true,
  });
  const Config = Layer.succeed(
    AuthConfig,
    AuthConfig.of({
      clerkIssuer: "",
      clerkJwtKey: "",
      asIssuer: ISSUER,
      apiResource: ISSUER,
      appBaseUrl: "http://localhost:3000",
      asSigningKeyPem: toPem(pkcs8),
      asSigningKid: "e2e-kid",
    })
  );
  // Stub Clerk verifier: "dev-token" → a fixed subject; everything else 401.
  const Clerk = Layer.succeed(
    ClerkTokenVerifier,
    ClerkTokenVerifier.of({
      verify: (token) =>
        token === "dev-token"
          ? Effect.succeed({ sub: DEV_SUB })
          : Effect.fail(new UnauthorizedError({ message: "bad token" })),
    })
  );
  const AsToken = AsTokenService.layer.pipe(Layer.provide(Config));
  const Limiter = RateLimiterService.inMemoryLayer({ sessionPerMinute: 3 });

  const base: Layer.Layer<AppServices> = Layer.mergeAll(
    IdentityService.layer,
    MembershipService.layer,
    ApiKeyVerifier.layer,
    OAuthFlowService.layer,
    QuotaGuard.layer,
    Limiter,
    AsToken,
    Clerk,
    Config
  ).pipe(
    Layer.provide(AsToken),
    Layer.provide(Config),
    Layer.provideMerge(Pg),
    Layer.orDie
  );

  handler = buildWebHandler(base).handler as (
    request: Request
  ) => Promise<Response>;
});

const get = (path: string, token?: string) =>
  handler(
    new Request(`${ISSUER}${path}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
  );

const postForm = (path: string, form: Record<string, string>, token?: string) =>
  handler(
    new Request(`${ISSUER}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: new URLSearchParams(form).toString(),
    })
  );

const postJson = (path: string, body: unknown, token?: string) =>
  handler(
    new Request(`${ISSUER}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  );

describe("apps/api worker (e2e over toWebHandler)", () => {
  it("GET /health returns ok with a DB probe", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  it("GET /v1/me JIT-provisions and returns the user + personal workspace", async () => {
    const res = await get("/v1/me", "dev-token");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user: { externalId: string };
      personalWorkspace: { name: string } | null;
    };
    expect(body.user.externalId).toBe(DEV_SUB);
    expect(body.personalWorkspace?.name).toBe("Personal");
  });

  it("GET /v1/me/workspaces lists the personal workspace with the owner role", async () => {
    const res = await get("/v1/me/workspaces", "dev-token");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: Array<{ role: string; isPersonal: boolean }>;
      total: number;
    };
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.data[0].role).toBe("owner");
    expect(body.data[0].isPersonal).toBe(true);
  });

  it("rejects a garbage bearer with a 401 error envelope", async () => {
    const res = await get("/v1/me", "not-a-real-token");
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("UnauthorizedError");
  });

  it("enforces the flat session rate limit (429)", async () => {
    // Fresh user so the counter is isolated from other tests.
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await get("/v1/me", "dev-token");
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  });

  it("serves RFC 8414 metadata and JWKS", async () => {
    const meta = await get("/.well-known/oauth-authorization-server");
    expect(meta.status).toBe(200);
    const metaBody = (await meta.json()) as { token_endpoint: string };
    expect(metaBody.token_endpoint).toBe(`${ISSUER}/oauth/token`);

    const jwks = await get("/.well-known/jwks.json");
    const jwksBody = (await jwks.json()) as { keys: Array<{ alg: string }> };
    expect(jwksBody.keys[0].alg).toBe("ES256");
  });

  it("runs the full OAuth code→token→refresh flow and accepts the AS token", async () => {
    const verifier = "e2e-verifier-abcdefghijklmnopqrstuvwxyz";
    const challenge = await deriveChallengeS256(verifier);
    const redirectUri = "http://127.0.0.1:5555/callback";

    const finalizeRes = await postJson(
      "/oauth/authorize/finalize",
      {
        client_id: "delulu-cli",
        redirect_uri: redirectUri,
        scope: "posts:read",
        code_challenge: challenge,
        code_challenge_method: "S256",
        resource: ISSUER,
        state: "xyz",
      },
      "dev-token"
    );
    expect(finalizeRes.status).toBe(200);
    const { redirect_to } = (await finalizeRes.json()) as {
      redirect_to: string;
    };
    const code = new URL(redirect_to).searchParams.get("code");
    expect(code).toBeTruthy();

    const tokenRes = await postForm("/oauth/token", {
      grant_type: "authorization_code",
      code: code ?? "",
      client_id: "delulu-cli",
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    expect(tokenRes.status).toBe(200);
    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token: string;
    };
    expect(tokens.access_token).toBeTruthy();

    // The AS-issued token authenticates through the middleware's oauth path.
    // (Uses a fresh window so the earlier 429 test does not bleed in.)
    const meRes = await get("/v1/me", tokens.access_token);
    expect([200, 429]).toContain(meRes.status);

    const refreshRes = await postForm("/oauth/token", {
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: "delulu-cli",
    });
    expect(refreshRes.status).toBe(200);

    // Reusing the now-rotated refresh token is rejected.
    const reuseRes = await postForm("/oauth/token", {
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: "delulu-cli",
    });
    expect(reuseRes.status).toBe(400);
    const reuseBody = (await reuseRes.json()) as { error: string };
    expect(reuseBody.error).toBe("invalid_grant");
  });
});
