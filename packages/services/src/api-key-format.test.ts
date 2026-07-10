import { describe, expect, it } from "vitest";
import {
  API_KEY_SCHEME,
  generateApiKey,
  hashApiKey,
  isApiKey,
  parseApiKey,
} from "./api-key-format";

describe("API key format", () => {
  it("mints a scheme-prefixed key whose prefix and hash line up", async () => {
    const key = await generateApiKey();
    expect(key.token.startsWith(API_KEY_SCHEME)).toBe(true);
    expect(parseApiKey(key.token)?.prefix).toBe(key.prefix);
    expect(await hashApiKey(key.token)).toBe(key.hash);
  });

  it("hashing is deterministic", async () => {
    const key = await generateApiKey();
    expect(await hashApiKey(key.token)).toBe(await hashApiKey(key.token));
  });

  it("rejects tokens without the scheme", () => {
    expect(isApiKey("Bearer whatever")).toBe(false);
    expect(parseApiKey("nope")).toBeNull();
    expect(parseApiKey(`${API_KEY_SCHEME}short`)).toBeNull();
  });
});
