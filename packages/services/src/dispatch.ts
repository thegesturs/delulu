import type { CredentialKind } from "@delulu/core";
import { isApiKey } from "./api-key-format";
import { parseJwt } from "./jwt";

/**
 * Classify a bearer credential so the Authentication middleware can route it to
 * the right verifier (#149): `dsk_…` → API key; a JWT issued by our own AS
 * (`iss === asIssuer`) → OAuth access token; anything else → a Clerk session.
 */
export const classifyBearer = (
  token: string,
  asIssuer: string
): CredentialKind => {
  if (isApiKey(token)) {
    return "apiKey";
  }
  const parsed = parseJwt(token);
  if (parsed !== null && parsed.claims.iss === asIssuer) {
    return "oauth";
  }
  return "session";
};
