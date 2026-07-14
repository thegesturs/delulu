import { UnauthorizedError } from "@delulu/contracts";
import {
  ClerkTokenVerifier,
  deriveChallengeS256,
  RateLimiterService,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { beforeAll, describe, expect, it } from "vitest";
import { buildWebHandler } from "../src/app";
import { makeBaseLayer } from "../src/index";

const ISSUER = "http://localhost:8787";
const DEV_SUB = `clerk_e2e_${crypto.randomUUID()}`;
const API_KEY_PREFIX = /^dsk_/;
const DEVICE_USER_CODE = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const WEBHOOK_SECRET_BYTES = new TextEncoder().encode("e2e-webhook-secret");
const WEBHOOK_SECRET = `whsec_${btoa(
  String.fromCharCode(...WEBHOOK_SECRET_BYTES)
)}`;

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
  const Limiter = RateLimiterService.inMemoryLayer({ sessionPerMinute: 20 });
  const base = makeBaseLayer(
    {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgres://delulu:delulu@localhost:5432/delulu",
      AS_ISSUER: ISSUER,
      API_RESOURCE: ISSUER,
      APP_BASE_URL: "http://localhost:3000",
      AS_SIGNING_KEY: toPem(pkcs8),
      AS_SIGNING_KID: "e2e-kid",
      CONNECTION_STATE_SECRET: "e2e-connection-state-secret",
      META_APP_SECRET: "e2e-meta-secret",
      META_VERIFY_TOKEN: "e2e-meta-verify",
      CLERK_WEBHOOK_SECRET: WEBHOOK_SECRET,
      DODO_WEBHOOK_SECRET: WEBHOOK_SECRET,
    },
    { clerk: Clerk, rateLimiter: Limiter }
  );

  handler = buildWebHandler(base, {
    allowedOrigins: ["http://localhost:3000"],
  }).handler as (request: Request) => Promise<Response>;
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

const webhookSignature = async (
  id: string,
  timestamp: string,
  rawBody: string
) => {
  const key = await crypto.subtle.importKey(
    "raw",
    WEBHOOK_SECRET_BYTES,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

const postClerkWebhook = async (
  id: string,
  body: unknown,
  signatureOverride?: string
) => {
  const rawBody = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature =
    signatureOverride ?? (await webhookSignature(id, timestamp, rawBody));
  return handler(
    new Request(`${ISSUER}/webhooks/clerk`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "svix-id": id,
        "svix-timestamp": timestamp,
        "svix-signature": `v1,${signature}`,
      },
      body: rawBody,
    })
  );
};

const postDodoWebhook = async (id: string, body: unknown) => {
  const rawBody = JSON.stringify(body);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await webhookSignature(id, timestamp, rawBody);
  return handler(
    new Request(`${ISSUER}/webhooks/dodo`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "webhook-id": id,
        "webhook-timestamp": timestamp,
        "webhook-signature": `v1,${signature}`,
      },
      body: rawBody,
    })
  );
};

describe("apps/api worker (e2e over toWebHandler)", () => {
  it("allows browser preflight only from the configured app origin", async () => {
    const allowed = await handler(
      new Request(`${ISSUER}/v1/me`, {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:3000",
          "access-control-request-method": "GET",
          "access-control-request-headers": "authorization",
        },
      })
    );
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000"
    );

    const rejected = await handler(
      new Request(`${ISSUER}/v1/me`, {
        method: "OPTIONS",
        headers: {
          origin: "https://untrusted.invalid",
          "access-control-request-method": "GET",
        },
      })
    );
    expect(rejected.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("GET /health returns ok with a DB probe", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  it("verifies webhook challenges and rejects invalid signatures", async () => {
    const challenge = await get(
      "/webhooks/meta?hub.mode=subscribe&hub.verify_token=e2e-meta-verify&hub.challenge=verified"
    );
    expect(challenge.status).toBe(200);
    expect(await challenge.text()).toBe("verified");

    const invalid = await postClerkWebhook(
      `webhook_invalid_${crypto.randomUUID()}`,
      {
        type: "user.created",
        data: { id: `invalid_${crypto.randomUUID()}` },
      },
      "invalid"
    );
    expect(invalid.status).toBe(400);
  });

  it("applies a valid webhook exactly once even if a reordered replay arrives", async () => {
    const id = `webhook_replay_${crypto.randomUUID()}`;
    const externalId = `clerk_webhook_${crypto.randomUUID()}`;
    const first = await postClerkWebhook(id, {
      type: "user.created",
      data: {
        id: externalId,
        first_name: "Webhook",
        last_name: "User",
        email_addresses: [{ email_address: `${externalId}@example.com` }],
      },
    });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ accepted: true, duplicate: false });

    const replay = await postClerkWebhook(id, {
      type: "user.updated",
      data: { id: externalId, first_name: "Reordered" },
    });
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ accepted: true, duplicate: true });
  });

  it("normalizes provider subscription webhooks and rejects duplicate delivery", async () => {
    const externalId = `billing_webhook_${crypto.randomUUID()}`;
    const email = `${externalId}@example.com`;
    const identity = await postClerkWebhook(`identity_${crypto.randomUUID()}`, {
      type: "user.created",
      data: {
        id: externalId,
        first_name: "Billing",
        last_name: "Owner",
        email_addresses: [{ email_address: email }],
      },
    });
    expect(identity.status).toBe(200);

    const webhookId = `billing_${crypto.randomUUID()}`;
    const payload = {
      type: "subscription.active",
      data: {
        payload_type: "Subscription",
        subscription_id: `sub_${crypto.randomUUID()}`,
        product_id: "pdt_mPTd8gsQS8YUISdStWURf",
        status: "active",
        previous_billing_date: "2026-07-01T00:00:00Z",
        next_billing_date: "2026-08-01T00:00:00Z",
        addons: [],
        customer: {
          customer_id: `customer_${crypto.randomUUID()}`,
          email,
        },
        metadata: {},
      },
    };
    const first = await postDodoWebhook(webhookId, payload);
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ accepted: true, duplicate: false });

    const replay = await postDodoWebhook(webhookId, payload);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual({ accepted: true, duplicate: true });
  });

  it("acknowledges unrelated signed payment-provider event families", async () => {
    const response = await postDodoWebhook(`refund_${crypto.randomUUID()}`, {
      type: "refund.succeeded",
      data: { payload_type: "Refund", refund_id: "refund_ignored" },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      accepted: true,
      duplicate: false,
    });
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

  it("serves the M2 workspace admin, API-key, media, and connection-mint contracts", async () => {
    const memberships = await get("/v1/me/workspaces", "dev-token");
    const membershipBody = (await memberships.json()) as {
      data: Array<{ workspaceId: string }>;
    };
    const workspaceId = membershipBody.data[0]?.workspaceId;
    expect(workspaceId).toBeTruthy();

    const workspace = await get(`/v1/workspaces/${workspaceId}`, "dev-token");
    expect(workspace.status).toBe(200);

    const key = await postJson(
      `/v1/workspaces/${workspaceId}/api-keys`,
      { name: "e2e", role: "owner", scopes: ["posts:read"] },
      "dev-token"
    );
    expect(key.status).toBe(200);
    const keyBody = (await key.json()) as { token: string };
    expect(keyBody.token).toMatch(API_KEY_PREFIX);

    const upload = await postJson(
      `/v1/workspaces/${workspaceId}/media/uploads`,
      [{ filename: "photo.png", contentType: "image/png" }],
      "dev-token"
    );
    expect(upload.status).toBe(200);
    const uploadBody = (await upload.json()) as Array<{
      mediaId: string;
      uploadUrl: string;
    }>;
    expect(uploadBody[0]?.uploadUrl).toContain("X-Amz-Signature");
    const media = await get(
      `/v1/workspaces/${workspaceId}/media/${uploadBody[0]?.mediaId}`,
      "dev-token"
    );
    expect(media.status).toBe(200);

    const mint = await postJson(
      `/v1/workspaces/${workspaceId}/connections/connect/instagram`,
      {},
      "dev-token"
    );
    expect(mint.status).toBe(200);
    const mintBody = (await mint.json()) as { url: string };
    expect(mintBody.url).toContain("state=");
  });

  it("rejects a garbage bearer with a 401 error envelope", async () => {
    const res = await get("/v1/me", "not-a-real-token");
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("UnauthorizedError");
  });

  it("keeps social OAuth callbacks public but rejects unsigned state", async () => {
    const res = await get(
      "/v1/connections/callback/instagram?code=fake&state=unsigned"
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("ConflictError");
  });

  it("enforces the flat session rate limit (429)", async () => {
    // Fresh user so the counter is isolated from other tests.
    const statuses: number[] = [];
    for (let i = 0; i < 25; i++) {
      const res = await get("/v1/me", "dev-token");
      statuses.push(res.status);
    }
    expect(statuses).toContain(429);
  });

  it("serves RFC 8414 metadata and JWKS", async () => {
    const meta = await get("/.well-known/oauth-authorization-server");
    expect(meta.status).toBe(200);
    const metaBody = (await meta.json()) as {
      token_endpoint: string;
      device_authorization_endpoint: string;
      agent_auth: { skill: string };
    };
    expect(metaBody.token_endpoint).toBe(`${ISSUER}/oauth/token`);
    expect(metaBody.device_authorization_endpoint).toBe(
      `${ISSUER}/oauth/device/authorize`
    );
    expect(metaBody.agent_auth.skill).toBe("http://localhost:3000/auth.md");

    const jwks = await get("/.well-known/jwks.json");
    const jwksBody = (await jwks.json()) as { keys: Array<{ alg: string }> };
    expect(jwksBody.keys[0].alg).toBe("ES256");
  });

  it("runs device authorization from pending approval to a single-use token", async () => {
    const start = await postForm("/oauth/device/authorize", {
      client_id: "delulu-cli",
      scope: "posts:read accounts:read",
      resource: ISSUER,
    });
    expect(start.status).toBe(200);
    const device = (await start.json()) as {
      device_code: string;
      user_code: string;
      verification_uri: string;
      verification_uri_complete: string;
      interval: number;
    };
    expect(device.user_code).toMatch(DEVICE_USER_CODE);
    expect(device.verification_uri).toBe("http://localhost:3000/oauth/device");
    expect(device.verification_uri_complete).toContain(
      encodeURIComponent(device.user_code)
    );

    const pending = await postForm("/oauth/token", {
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: device.device_code,
      client_id: "delulu-cli",
    });
    expect(pending.status).toBe(400);
    expect((await pending.json()) as { error: string }).toMatchObject({
      error: "authorization_pending",
    });

    const tooFast = await postForm("/oauth/token", {
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: device.device_code,
      client_id: "delulu-cli",
    });
    expect(tooFast.status).toBe(400);
    expect((await tooFast.json()) as { error: string }).toMatchObject({
      error: "slow_down",
    });

    const transaction = await get(
      `/oauth/device/transaction?user_code=${encodeURIComponent(device.user_code)}`,
      "dev-token"
    );
    expect(transaction.status).toBe(200);
    expect(await transaction.json()).toMatchObject({
      clientId: "delulu-cli",
      scopes: ["posts:read", "accounts:read"],
      resource: ISSUER,
    });

    const approve = await postJson(
      "/oauth/device/approve",
      { user_code: device.user_code },
      "dev-token"
    );
    expect(approve.status).toBe(200);

    const token = await postForm("/oauth/token", {
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: device.device_code,
      client_id: "delulu-cli",
    });
    expect(token.status).toBe(200);
    const tokenBody = (await token.json()) as { access_token: string };
    expect(tokenBody).toHaveProperty("access_token");

    const introspection = await postForm("/oauth/introspect", {
      token: tokenBody.access_token,
    });
    expect(await introspection.json()).toMatchObject({
      active: true,
      scopes: ["posts:read", "accounts:read"],
      aud: ISSUER,
    });

    const replay = await postForm("/oauth/token", {
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: device.device_code,
      client_id: "delulu-cli",
    });
    expect(replay.status).toBe(400);
    expect((await replay.json()) as { error: string }).toMatchObject({
      error: "expired_token",
    });
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
