import {
  base64UrlDecodeBytes,
  base64UrlDecodeString,
  base64UrlEncodeString,
  signEs256,
  verifyEs256,
  verifyRs256,
} from "./crypto";

export interface JwtHeader {
  readonly alg: string;
  readonly kid?: string;
  readonly typ?: string;
}

export interface JwtClaims {
  readonly sub?: string;
  readonly iss?: string;
  readonly aud?: string | readonly string[];
  readonly exp?: number;
  readonly nbf?: number;
  readonly iat?: number;
  readonly azp?: string;
  readonly scope?: string;
  readonly [claim: string]: unknown;
}

export interface ParsedJwt {
  readonly header: JwtHeader;
  readonly claims: JwtClaims;
  readonly signingInput: string;
  readonly signature: Uint8Array;
}

/** Structurally parse a compact JWS. Returns null on any malformed input. */
export const parseJwt = (token: string): ParsedJwt | null => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  try {
    const header = JSON.parse(base64UrlDecodeString(headerB64)) as JwtHeader;
    const claims = JSON.parse(base64UrlDecodeString(payloadB64)) as JwtClaims;
    return {
      header,
      claims,
      signingInput: `${headerB64}.${payloadB64}`,
      signature: base64UrlDecodeBytes(signatureB64),
    };
  } catch {
    return null;
  }
};

export interface TimeClaimOptions {
  readonly now: number; // epoch seconds
  readonly clockToleranceSeconds?: number;
}

/** Validate `exp`/`nbf` against the supplied clock. */
export const timeClaimsValid = (
  claims: JwtClaims,
  { now, clockToleranceSeconds = 30 }: TimeClaimOptions
): boolean => {
  if (
    typeof claims.exp === "number" &&
    now > claims.exp + clockToleranceSeconds
  ) {
    return false;
  }
  if (
    typeof claims.nbf === "number" &&
    now < claims.nbf - clockToleranceSeconds
  ) {
    return false;
  }
  return true;
};

/** Whether a token's `aud` claim contains the expected resource (RFC 8707). */
export const audienceMatches = (
  claims: JwtClaims,
  expected: string
): boolean => {
  if (typeof claims.aud === "string") {
    return claims.aud === expected;
  }
  if (Array.isArray(claims.aud)) {
    return claims.aud.includes(expected);
  }
  return false;
};

export const verifyRs256Jwt = async (
  parsed: ParsedJwt,
  key: CryptoKey
): Promise<boolean> => verifyRs256(key, parsed.signingInput, parsed.signature);

export const verifyEs256Jwt = async (
  parsed: ParsedJwt,
  key: CryptoKey
): Promise<boolean> => verifyEs256(key, parsed.signingInput, parsed.signature);

/** Sign a compact ES256 JWT. */
export const signEs256Jwt = async (
  key: CryptoKey,
  header: JwtHeader,
  claims: JwtClaims
): Promise<string> => {
  const signingInput = `${base64UrlEncodeString(
    JSON.stringify(header)
  )}.${base64UrlEncodeString(JSON.stringify(claims))}`;
  const signature = await signEs256(key, signingInput);
  return `${signingInput}.${signature}`;
};
