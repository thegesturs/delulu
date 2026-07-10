/**
 * Low-level crypto primitives over WebCrypto (`globalThis.crypto.subtle`) — the
 * one API available identically on Cloudflare Workers and Node ≥ 20. All
 * functions are plain async; services wrap them in `Effect.tryPromise`.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PLUS = /\+/g;
const SLASH = /\//g;
const TRAILING_EQ = /=+$/;
const DASH = /-/g;
const UNDERSCORE = /_/g;
const PEM_BEGIN = /-----BEGIN [^-]+-----/;
const PEM_END = /-----END [^-]+-----/;
const WHITESPACE = /\s+/g;

// --- base64url ---------------------------------------------------------------

export const base64UrlEncodeBytes = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(PLUS, "-")
    .replace(SLASH, "_")
    .replace(TRAILING_EQ, "");
};

export const base64UrlDecodeBytes = (value: string): Uint8Array => {
  const normalized = value.replace(DASH, "+").replace(UNDERSCORE, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const base64UrlEncodeString = (value: string): string =>
  base64UrlEncodeBytes(encoder.encode(value));

export const base64UrlDecodeString = (value: string): string =>
  decoder.decode(base64UrlDecodeBytes(value));

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

// --- hashing -----------------------------------------------------------------

export const sha256Hex = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return toHex(new Uint8Array(digest));
};

export const sha256Base64Url = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return base64UrlEncodeBytes(new Uint8Array(digest));
};

/** Opaque, high-entropy URL-safe token (authorization codes, refresh tokens). */
export const randomTokenBase64Url = (byteLength = 32): string => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncodeBytes(bytes);
};

/** Constant-time string comparison (avoids leaking match length via timing). */
export const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: constant-time compare
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

// --- PEM / DER ---------------------------------------------------------------

const pemToDer = (pem: string): Uint8Array => {
  const body = pem
    .replace(PEM_BEGIN, "")
    .replace(PEM_END, "")
    .replace(WHITESPACE, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// --- RS256 (Clerk session JWT verification) ----------------------------------

export const importRsaPublicKeyFromPem = (pem: string): Promise<CryptoKey> =>
  crypto.subtle.importKey(
    "spki",
    pemToDer(pem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

export const verifyRs256 = (
  key: CryptoKey,
  signingInput: string,
  signature: Uint8Array
): Promise<boolean> =>
  crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    encoder.encode(signingInput)
  );

// --- ES256 (our own AS token signing) ----------------------------------------

const ES256_PARAMS = { name: "ECDSA", namedCurve: "P-256" } as const;

export const importEcPrivateKeyFromPkcs8 = (pem: string): Promise<CryptoKey> =>
  crypto.subtle.importKey("pkcs8", pemToDer(pem), ES256_PARAMS, true, ["sign"]);

export const importEcPrivateKeyFromJwk = (
  jwk: JsonWebKey
): Promise<CryptoKey> =>
  crypto.subtle.importKey("jwk", jwk, ES256_PARAMS, true, ["sign"]);

export const signEs256 = async (
  key: CryptoKey,
  signingInput: string
): Promise<string> => {
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(signingInput)
  );
  return base64UrlEncodeBytes(new Uint8Array(signature));
};

export const verifyEs256 = (
  key: CryptoKey,
  signingInput: string,
  signature: Uint8Array
): Promise<boolean> =>
  crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    signature,
    encoder.encode(signingInput)
  );

/** The public JWK (for the JWKS endpoint) derived from a signing key. */
export const exportPublicJwk = async (
  privateKey: CryptoKey
): Promise<JsonWebKey> => {
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  // Strip private material; keep only the public EC parameters.
  return {
    kty: jwk.kty,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
  };
};
