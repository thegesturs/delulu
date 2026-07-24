import { afterEach, describe, expect, it, vi } from "vitest";
import {
  callbackRedirect,
  transferRequiredRedirect,
  withConnectionClient,
  withConnectionReturnTarget,
  withConnectionSuccess,
} from "./callback-response";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("withConnectionClient", () => {
  it("preserves CLI context on a callback error for retries", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");
    const response = withConnectionClient(
      callbackRedirect("/socials?error=user_denied&provider=twitter"),
      "cli"
    );

    expect(response.headers.get("Location")).toBe(
      "https://app.example.com/socials?error=user_denied&provider=twitter&client=cli"
    );
  });
});

describe("withConnectionSuccess", () => {
  it("adds signed callback context to a successful redirect", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");

    const response = withConnectionSuccess(callbackRedirect("/socials"), {
      provider: "TWITTER",
      username: "swarajb",
      client: "cli",
    });
    const location = new URL(response.headers.get("Location") ?? "");

    expect(Object.fromEntries(location.searchParams)).toEqual({
      success: "true",
      provider: "twitter",
      client: "cli",
    });
    expect(new URLSearchParams(location.hash.slice(1)).get("username")).toBe(
      "swarajb"
    );
  });

  it("does not decorate errors or transfer notifications", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");
    const error = callbackRedirect("/socials?error=server_error");
    const transfer = callbackRedirect(
      "/socials?notification=account_transferred"
    );

    expect(
      withConnectionSuccess(error, {
        provider: "twitter",
        username: "swarajb",
        client: "cli",
      }).headers.get("Location")
    ).toBe("https://app.example.com/socials?error=server_error");
    expect(
      withConnectionSuccess(transfer, {
        provider: "twitter",
        username: "swarajb",
        client: "cli",
      }).headers.get("Location")
    ).toBe("https://app.example.com/socials?notification=account_transferred");
  });
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

describe("withConnectionReturnTarget", () => {
  it("returns every socials callback outcome to the onboarding connect step", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");

    const success = withConnectionReturnTarget(
      callbackRedirect(
        "/socials?success=true&provider=instagram#username=creator"
      ),
      "onboarding-connect"
    );
    const failure = withConnectionReturnTarget(
      callbackRedirect("/socials?error=user_denied&provider=instagram"),
      "onboarding-connect"
    );

    expect(success.headers.get("Location")).toBe(
      "https://app.example.com/onboarding?success=true&provider=instagram&step=connect#username=creator"
    );
    expect(failure.headers.get("Location")).toBe(
      "https://app.example.com/onboarding?error=user_denied&provider=instagram&step=connect"
    );
  });

  it("preserves transfer details when returning to onboarding", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");
    const response = withConnectionReturnTarget(
      transferRequiredRedirect({
        platform: "instagram",
        connectionId: "connection/one",
        sourceWorkspaceId: "workspace two",
      }),
      "onboarding-connect"
    );
    const location = new URL(response.headers.get("Location") ?? "");

    expect(location.pathname).toBe("/onboarding");
    expect(Object.fromEntries(location.searchParams)).toEqual({
      notification: "transfer_required",
      platform: "instagram",
      connectionId: "connection/one",
      sourceWorkspaceId: "workspace two",
      step: "connect",
    });
  });

  it("leaves the account-settings callback unchanged by default", () => {
    vi.stubEnv("APP_BASE_URL", "https://app.example.com");
    const response = callbackRedirect("/socials?success=true");

    expect(withConnectionReturnTarget(response).headers.get("Location")).toBe(
      "https://app.example.com/socials?success=true"
    );
  });
});
