import { sha256Hex } from "./crypto";

/**
 * API key wire format: `dsk_<12-char prefix><secret>`. The prefix is stored in
 * `api_keys.key_prefix` for an indexed lookup; only the SHA-256 of the whole key
 * is stored (`key_hash`) and compared in constant time. Mirrors the existing
 * production scheme (#149 leaves the exact format to the implementer).
 */
export const API_KEY_SCHEME = "dsk_";
const PREFIX_LENGTH = 12;
const SECRET_LENGTH = 24;

// URL-safe alphabet (base64url minus padding); random bytes rejection-sampled
// against a power-of-two-sized alphabet keep the distribution uniform.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const randomString = (length: number): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: uniform 6-bit sampling into a 64-char alphabet
    out += ALPHABET[bytes[i] & 63];
  }
  return out;
};

const makePrefix = () => randomString(PREFIX_LENGTH);
const makeSecret = () => randomString(SECRET_LENGTH);

export interface GeneratedApiKey {
  /** The full secret shown to the user exactly once. */
  readonly token: string;
  /** Stored in `key_prefix` for lookup. */
  readonly prefix: string;
  /** SHA-256 hex of the full token, stored in `key_hash`. */
  readonly hash: string;
}

/** Mint a fresh API key (used by the M2 minting endpoint). */
export const generateApiKey = async (): Promise<GeneratedApiKey> => {
  const prefix = makePrefix();
  const token = `${API_KEY_SCHEME}${prefix}${makeSecret()}`;
  const hash = await sha256Hex(token);
  return { token, prefix, hash };
};

/** Extract the lookup prefix from a presented key, or null if malformed. */
export const parseApiKey = (
  token: string
): { readonly prefix: string } | null => {
  if (!token.startsWith(API_KEY_SCHEME)) {
    return null;
  }
  const body = token.slice(API_KEY_SCHEME.length);
  if (body.length <= PREFIX_LENGTH) {
    return null;
  }
  return { prefix: body.slice(0, PREFIX_LENGTH) };
};

export const isApiKey = (token: string): boolean =>
  token.startsWith(API_KEY_SCHEME);

export const hashApiKey = (token: string): Promise<string> => sha256Hex(token);
