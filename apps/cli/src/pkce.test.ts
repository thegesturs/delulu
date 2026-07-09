import { describe, expect, it } from "vitest";
import { createCodeChallenge } from "./pkce.js";

describe("createCodeChallenge", () => {
  it("matches the RFC 7636 S256 test vector", () => {
    expect(
      createCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
    ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});
