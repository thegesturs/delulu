import { Context } from "effect";

const sha256Signature = /^[a-f\d]{64}$/i;

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const signCalendarWebhook = async (rawBody: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return hex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody))
  );
};

export const verifyCalendarWebhook = async (
  rawBody: string,
  signature: string,
  secret: string
) => {
  if (!(signature && secret && sha256Signature.test(signature))) {
    return false;
  }
  const expected = await signCalendarWebhook(rawBody, secret);
  const left = new TextEncoder().encode(expected.toLowerCase());
  const right = new TextEncoder().encode(signature.toLowerCase());
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch += Math.abs(left[index]! - right[index]!);
  }
  return mismatch === 0;
};

export class CalendarWebhookConfig extends Context.Service<
  CalendarWebhookConfig,
  { readonly secret: string; readonly eventSlug: string }
>()("@delulu/services/CalendarWebhookConfig") {}
