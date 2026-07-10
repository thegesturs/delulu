import { describe, expect, it } from "vitest";
import { deriveChallengeS256, verifyPkceS256 } from "./pkce";

describe("PKCE S256", () => {
  it("derives the RFC 7636 test-vector challenge", async () => {
    // RFC 7636 Appendix B verifier/challenge pair.
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await deriveChallengeS256(verifier);
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("verifies a matching verifier/challenge", async () => {
    const verifier = "a-random-verifier-string-1234567890";
    const challenge = await deriveChallengeS256(verifier);
    expect(await verifyPkceS256(verifier, challenge)).toBe(true);
  });

  it("rejects a mismatched verifier", async () => {
    const challenge = await deriveChallengeS256("correct-verifier");
    expect(await verifyPkceS256("wrong-verifier", challenge)).toBe(false);
  });
});
