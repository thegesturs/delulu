import { afterEach, describe, expect, it, vi } from "vitest";
import { callbackRedirect } from "./callback-response";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("callbackRedirect", () => {
  it("redirects relative callback destinations to the configured app", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");

    const response = callbackRedirect("/socials?success=true");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "https://app.example.com/socials?success=true"
    );
  });

  it("rejects destinations outside the configured app", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");

    expect(() =>
      callbackRedirect("https://elsewhere.example.com/complete")
    ).toThrow("Callback redirect must be an app-relative path");
  });
});
