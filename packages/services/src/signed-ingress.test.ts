import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { SignedIngress, WebhookSecrets } from "./signed-ingress";

const secrets = WebhookSecrets.of({
  metaAppSecret: "meta-secret",
  metaVerifyToken: "verify-me",
  clerkSigningSecret: `whsec_${btoa("clerk-secret")}`,
  dodoSigningSecret: `whsec_${btoa("dodo-secret")}`,
  timestampToleranceSeconds: 300,
});
const layer = SignedIngress.layer.pipe(
  Layer.provide(Layer.succeed(WebhookSecrets, secrets))
);

const hmac = async (
  secret: string,
  payload: string,
  encoding: "hex" | "base64"
) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  );
  return encoding === "hex"
    ? [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")
    : btoa(String.fromCharCode(...bytes));
};

describe("signed webhook ingress", () => {
  it("verifies the raw Meta body", async () => {
    const rawBody = JSON.stringify({ object: "instagram", entry: [] });
    const signature = await hmac("meta-secret", rawBody, "hex");
    await Effect.runPromise(
      Effect.gen(function* () {
        const ingress = yield* SignedIngress;
        yield* ingress.verifyMeta({
          rawBody,
          signature: `sha256=${signature}`,
        });
      }).pipe(Effect.provide(layer))
    );
  });

  it("verifies a timestamped standard signature", async () => {
    const rawBody = JSON.stringify({
      type: "user.deleted",
      data: { id: "user_1" },
    });
    const id = "event_1";
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await hmac(
      "clerk-secret",
      `${id}.${timestamp}.${rawBody}`,
      "base64"
    );
    await Effect.runPromise(
      Effect.gen(function* () {
        const ingress = yield* SignedIngress;
        yield* ingress.verifyClerk(rawBody, {
          id,
          timestamp,
          signature: `v1,${signature}`,
        });
      }).pipe(Effect.provide(layer))
    );
  });

  it("rejects a stale signed request", async () => {
    const rawBody = "{}";
    const signature = await hmac(
      "clerk-secret",
      `event_1.0.${rawBody}`,
      "base64"
    );
    const exit = await Effect.runPromiseExit(
      Effect.gen(function* () {
        const ingress = yield* SignedIngress;
        yield* ingress.verifyClerk(rawBody, {
          id: "event_1",
          timestamp: "0",
          signature: `v1,${signature}`,
        });
      }).pipe(Effect.provide(layer))
    );
    expect(exit._tag).toBe("Failure");
  });
});
