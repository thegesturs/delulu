import { sha256Base64Url, timingSafeEqual } from "./crypto";

/**
 * PKCE S256 verification (RFC 7636). We only support S256 — `plain` is rejected
 * at the contract boundary. `challenge === base64url(sha256(verifier))`.
 */
export const deriveChallengeS256 = (verifier: string): Promise<string> =>
  sha256Base64Url(verifier);

export const verifyPkceS256 = async (
  verifier: string,
  challenge: string
): Promise<boolean> => {
  const derived = await deriveChallengeS256(verifier);
  return timingSafeEqual(derived, challenge);
};
