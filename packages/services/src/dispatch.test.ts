import { describe, expect, it } from "vitest";
import { base64UrlEncodeString } from "./crypto";
import { classifyBearer } from "./dispatch";

const ISSUER = "https://api.delulu.test";

const fakeJwt = (claims: Record<string, unknown>): string => {
  const header = base64UrlEncodeString(JSON.stringify({ alg: "ES256" }));
  const payload = base64UrlEncodeString(JSON.stringify(claims));
  return `${header}.${payload}.AAAA`;
};

describe("classifyBearer", () => {
  it("routes dsk_ tokens to the API-key verifier", () => {
    expect(classifyBearer("dsk_abcdefghijklmnopqrstuvwx", ISSUER)).toBe(
      "apiKey"
    );
  });

  it("routes tokens issued by our AS to the OAuth verifier", () => {
    expect(classifyBearer(fakeJwt({ iss: ISSUER, sub: "u" }), ISSUER)).toBe(
      "oauth"
    );
  });

  it("routes everything else to the Clerk session verifier", () => {
    expect(
      classifyBearer(fakeJwt({ iss: "https://clerk.example.com" }), ISSUER)
    ).toBe("session");
    expect(classifyBearer("not-a-jwt", ISSUER)).toBe("session");
  });
});
