import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionStore, type SocialProviderUpdate } from "./connection-store";
import { ensureFreshToken } from "./token-service";

describe("ensureFreshToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refreshes under the store lock and persists rotated credentials", async () => {
    const updates: SocialProviderUpdate[] = [];
    let lockCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            access_token: "access-new",
            refresh_token: "refresh-new",
            expires_in: 7200,
          }),
          { status: 200 }
        )
      )
    );
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection-1",
          socialType: "TWITTER" as const,
          accessToken: "access-old",
          refreshToken: "refresh-old",
          expiresIn: Date.now() - 1,
        }),
      updateSocialProvider: (update) =>
        Effect.sync(() => {
          updates.push(update);
        }),
      withTokenRefreshLock: (_id, effect) => {
        lockCalls += 1;
        return effect;
      },
    });

    const token = await Effect.runPromise(
      ensureFreshToken("connection-1").pipe(Effect.provide(Store))
    );

    expect(token).toBe("access-new");
    expect(lockCalls).toBe(1);
    expect(updates).toEqual([
      expect.objectContaining({
        accessToken: "access-new",
        refreshToken: "refresh-new",
      }),
    ]);
  });

  it("fails instead of publishing with a known-expired token", async () => {
    const updateSocialProvider = vi.fn(() => Effect.void);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unauthorized", { status: 401 }))
    );
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection-1",
          socialType: "TWITTER" as const,
          accessToken: "access-old",
          refreshToken: "refresh-old",
          expiresIn: Date.now() - 1,
        }),
      updateSocialProvider,
    });

    await expect(
      Effect.runPromise(
        ensureFreshToken("connection-1").pipe(Effect.provide(Store))
      )
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
    expect(updateSocialProvider).not.toHaveBeenCalled();
  });

  it("requires reconnect when an expired token has no refresh credential", async () => {
    const Store = Layer.succeed(ConnectionStore, {
      getSocialProviderWithDecryptedTokens: () =>
        Effect.succeed({
          _id: "connection-1",
          socialType: "LINKEDIN" as const,
          accessToken: "expired-access",
          expiresIn: Date.now() - 1,
        }),
      updateSocialProvider: () => Effect.void,
    });

    await expect(
      Effect.runPromise(
        ensureFreshToken("connection-1").pipe(Effect.provide(Store))
      )
    ).rejects.toMatchObject({ code: "TOKEN_EXPIRED", retryable: false });
  });
});
