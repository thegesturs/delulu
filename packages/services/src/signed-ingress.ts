import { WebhookIngressError } from "@delulu/core/domain/webhook-delivery";
import { Context, DateTime, Effect, Layer, Schema } from "effect";

export class WebhookSecrets extends Context.Service<
  WebhookSecrets,
  {
    readonly metaAppSecret: string;
    readonly metaVerifyToken: string;
    readonly clerkSigningSecret: string;
    readonly dodoSigningSecret: string;
    readonly timestampToleranceSeconds: number;
  }
>()("@delulu/services/WebhookSecrets") {}

const utf8 = (value: string) => new TextEncoder().encode(value);

const HEX_PATTERN = /^[0-9a-f]+$/i;
const decodeHex = (value: string): Uint8Array | null => {
  if (!(value.length % 2 === 0 && HEX_PATTERN.test(value))) {
    return null;
  }
  return Uint8Array.from({ length: value.length / 2 }, (_, index) =>
    Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  );
};

const decodeBase64 = (value: string): Uint8Array | null => {
  try {
    const decoded = atob(value);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

const signatureFailure = (
  reason: "missing_header" | "invalid_signature",
  message: string
) => new WebhookIngressError({ reason, message, retryable: false });

const verifyHmac = Effect.fn("verifyHmac")(function* (
  secret: Uint8Array,
  payload: string,
  signature: Uint8Array
) {
  const key = yield* Effect.tryPromise({
    try: () =>
      crypto.subtle.importKey(
        "raw",
        secret,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      ),
    catch: () =>
      signatureFailure(
        "invalid_signature",
        "Unable to initialize signature verification"
      ),
  });
  return yield* Effect.tryPromise({
    try: () => crypto.subtle.verify("HMAC", key, signature, utf8(payload)),
    catch: () =>
      signatureFailure("invalid_signature", "Unable to verify signature"),
  });
});

const StandardHeaders = Schema.Struct({
  id: Schema.String,
  timestamp: Schema.String,
  signature: Schema.String,
});
export type StandardHeaders = typeof StandardHeaders.Type;

export class SignedIngress extends Context.Service<
  SignedIngress,
  {
    readonly verifyMeta: (input: {
      readonly rawBody: string;
      readonly signature: string | null;
    }) => Effect.Effect<void, WebhookIngressError>;
    readonly verifyClerk: (
      rawBody: string,
      headers: StandardHeaders
    ) => Effect.Effect<void, WebhookIngressError>;
    readonly verifyDodo: (
      rawBody: string,
      headers: StandardHeaders
    ) => Effect.Effect<void, WebhookIngressError>;
    readonly verifyMetaChallenge: (input: {
      readonly mode: string | null;
      readonly token: string | null;
      readonly challenge: string | null;
    }) => Effect.Effect<string, WebhookIngressError>;
  }
>()("@delulu/services/SignedIngress") {
  static readonly layer = Layer.effect(
    SignedIngress,
    Effect.gen(function* () {
      const secrets = yield* WebhookSecrets;

      const verifyMeta = Effect.fn("SignedIngress.verifyMeta")(
        function* (input: {
          readonly rawBody: string;
          readonly signature: string | null;
        }) {
          if (!input.signature?.startsWith("sha256=")) {
            return yield* signatureFailure(
              "missing_header",
              "Missing Meta signature"
            );
          }
          const signature = decodeHex(input.signature.slice("sha256=".length));
          if (signature === null) {
            return yield* signatureFailure(
              "invalid_signature",
              "Malformed Meta signature"
            );
          }
          const valid = yield* verifyHmac(
            utf8(secrets.metaAppSecret),
            input.rawBody,
            signature
          );
          if (!valid) {
            return yield* signatureFailure(
              "invalid_signature",
              "Invalid Meta signature"
            );
          }
        }
      );

      const verifyStandard = Effect.fn("SignedIngress.verifyStandard")(
        function* (rawBody: string, headers: StandardHeaders, secret: string) {
          const parsedTimestamp = Number(headers.timestamp);
          if (!Number.isSafeInteger(parsedTimestamp)) {
            return yield* signatureFailure(
              "invalid_signature",
              "Malformed webhook timestamp"
            );
          }
          const now = yield* DateTime.now;
          const age = Math.abs(
            Math.floor(DateTime.toEpochMillis(now) / 1000) - parsedTimestamp
          );
          if (age > secrets.timestampToleranceSeconds) {
            return yield* new WebhookIngressError({
              reason: "stale_timestamp",
              message: "Webhook timestamp is outside the accepted window",
              retryable: false,
            });
          }
          const keyText = secret.startsWith("whsec_")
            ? secret.slice(6)
            : secret;
          const key = decodeBase64(keyText);
          if (key === null) {
            return yield* signatureFailure(
              "invalid_signature",
              "Webhook secret is malformed"
            );
          }
          const candidates = headers.signature
            .split(" ")
            .map((part) => part.split(","))
            .filter(([version, value]) => version === "v1" && value)
            .map(([, value]) => decodeBase64(value ?? ""))
            .filter((value): value is Uint8Array => value !== null);
          if (candidates.length === 0) {
            return yield* signatureFailure(
              "missing_header",
              "Missing webhook signature"
            );
          }
          const signed = `${headers.id}.${headers.timestamp}.${rawBody}`;
          for (const candidate of candidates) {
            if (yield* verifyHmac(key, signed, candidate)) {
              return;
            }
          }
          return yield* signatureFailure(
            "invalid_signature",
            "Invalid webhook signature"
          );
        }
      );

      const verifyClerk = Effect.fn("SignedIngress.verifyClerk")(
        (rawBody: string, headers: StandardHeaders) =>
          verifyStandard(rawBody, headers, secrets.clerkSigningSecret)
      );
      const verifyDodo = Effect.fn("SignedIngress.verifyDodo")(
        (rawBody: string, headers: StandardHeaders) =>
          verifyStandard(rawBody, headers, secrets.dodoSigningSecret)
      );
      const verifyMetaChallenge = Effect.fn(
        "SignedIngress.verifyMetaChallenge"
      )(function* (input: {
        readonly mode: string | null;
        readonly token: string | null;
        readonly challenge: string | null;
      }) {
        if (
          input.mode !== "subscribe" ||
          input.token !== secrets.metaVerifyToken ||
          input.challenge === null
        ) {
          return yield* signatureFailure(
            "invalid_signature",
            "Invalid Meta verification request"
          );
        }
        return input.challenge;
      });
      return SignedIngress.of({
        verifyMeta,
        verifyClerk,
        verifyDodo,
        verifyMetaChallenge,
      });
    })
  );
}
