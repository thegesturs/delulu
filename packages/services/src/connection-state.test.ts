import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConnectionStateConfig, ConnectionStateService } from "./connections";

const BASE64_PADDING = /=+$/;
const TEST_SECRET = "test-secret-with-enough-entropy";

const StateLayer = ConnectionStateService.layer.pipe(
  Layer.provide(
    Layer.succeed(
      ConnectionStateConfig,
      ConnectionStateConfig.of({ secret: TEST_SECRET })
    )
  )
);

const signForTest = async (value: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TEST_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  let raw = "";
  for (const byte of new Uint8Array(digest).slice(0, 16)) {
    raw += String.fromCharCode(byte);
  }
  return btoa(raw)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(BASE64_PADDING, "");
};

afterEach(() => {
  vi.useRealTimers();
});

describe("ConnectionStateService", () => {
  it("round-trips a workspace-bound state and rejects tampering", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ConnectionStateService;
      const state = yield* service.mint("workspace_aaaaaaaaaaaa", {
        userId: "user_aaaaaaaaaaaa" as never,
        credential: "session",
        scopes: "full",
      });
      const verified = yield* service.verify(state);
      const cliState = yield* service.mint(
        "workspace_aaaaaaaaaaaa",
        {
          userId: "user_aaaaaaaaaaaa" as never,
          credential: "session",
          scopes: "full",
        },
        "cli"
      );
      const cliVerified = yield* service.verify(cliState);
      const onboardingState = yield* service.mint(
        "workspace_aaaaaaaaaaaa",
        {
          userId: "user_aaaaaaaaaaaa" as never,
          credential: "session",
          scopes: "full",
        },
        undefined,
        "onboarding-connect"
      );
      const onboardingVerified = yield* service.verify(onboardingState);
      const tamperPayload = (value: string) => {
        const parts = value.split(".");
        const payload = parts[1] ?? "";
        parts[1] = `${payload.slice(0, -1)}${payload.endsWith("a") ? "b" : "a"}`;
        return parts.join(".");
      };
      const tamperedClient = yield* service
        .verify(tamperPayload(cliState))
        .pipe(Effect.result);
      const tamperedReturnTarget = yield* service
        .verify(tamperPayload(onboardingState))
        .pipe(Effect.result);
      const tampered = yield* service
        .verify(tamperPayload(state))
        .pipe(Effect.result);
      return {
        verified,
        cliVerified,
        onboardingVerified,
        tampered,
        tamperedClient,
        tamperedReturnTarget,
      };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(StateLayer))
    );
    expect(result.verified.workspaceId).toBe("workspace_aaaaaaaaaaaa");
    expect(result.verified.principal).toBe("u:user_aaaaaaaaaaaa");
    expect(result.verified.client).toBeUndefined();
    expect(result.cliVerified.client).toBe("cli");
    expect(result.onboardingVerified.returnTarget).toBe("onboarding-connect");
    expect(result.tampered._tag).toBe("Failure");
    expect(result.tamperedClient._tag).toBe("Failure");
    expect(result.tamperedReturnTarget._tag).toBe("Failure");
  });

  it("accepts a valid legacy state during the callback rollout", async () => {
    const issuedAt = Math.floor(Date.now() / 1000);
    const value = `workspace_aaaaaaaaaaaa.u:user_aaaaaaaaaaaa.legacy_nonce.${issuedAt}.cli`;
    const signature = await signForTest(value);

    const verified = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConnectionStateService;
        return yield* service.verify(`${value}.${signature}`);
      }).pipe(Effect.provide(StateLayer))
    );

    expect(verified.workspaceId).toBe("workspace_aaaaaaaaaaaa");
    expect(verified.client).toBe("cli");
    expect(verified.returnTarget).toBeUndefined();
  });

  it("round-trips a short-lived OAuth transfer grant and rejects tampering", async () => {
    const program = Effect.gen(function* () {
      const service = yield* ConnectionStateService;
      const token = yield* service.mintTransfer({
        connectionId: "connection_aaaaaaaaaaaa",
        sourceWorkspaceId: "workspace_source",
        destinationWorkspaceId: "workspace_destination",
        principal: "u:user_aaaaaaaaaaaa",
      });
      const verified = yield* service.verifyTransfer(token);
      const tampered = yield* service
        .verifyTransfer(`${token.slice(0, -1)}x`)
        .pipe(Effect.result);
      return { verified, tampered };
    });

    const result = await Effect.runPromise(
      program.pipe(Effect.provide(StateLayer))
    );
    expect(result.verified).toMatchObject({
      connectionId: "connection_aaaaaaaaaaaa",
      sourceWorkspaceId: "workspace_source",
      destinationWorkspaceId: "workspace_destination",
      principal: "u:user_aaaaaaaaaaaa",
    });
    expect(result.tampered._tag).toBe("Failure");
  });

  it("rejects expired states and signed payloads with invalid return targets", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T00:00:00Z"));
    const state = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConnectionStateService;
        return yield* service.mint(
          "workspace_aaaaaaaaaaaa",
          {
            userId: "user_aaaaaaaaaaaa" as never,
            credential: "session",
            scopes: "full",
          },
          undefined,
          "onboarding-connect"
        );
      }).pipe(Effect.provide(StateLayer))
    );
    const transferToken = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConnectionStateService;
        return yield* service.mintTransfer({
          connectionId: "connection_aaaaaaaaaaaa",
          sourceWorkspaceId: "workspace_source",
          destinationWorkspaceId: "workspace_destination",
          principal: "u:user_aaaaaaaaaaaa",
        });
      }).pipe(Effect.provide(StateLayer))
    );

    const parts = state.split(".");
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(
            (parts[1] ?? "")
              .replaceAll("-", "+")
              .replaceAll("_", "/")
              .padEnd(Math.ceil((parts[1]?.length ?? 0) / 4) * 4, "=")
          ),
          (character) => character.charCodeAt(0)
        )
      )
    ) as Record<string, unknown>;
    payload.returnTarget = "untrusted-target";
    const encodedPayload = btoa(JSON.stringify(payload))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(BASE64_PADDING, "");
    const invalidValue = `v2.${encodedPayload}`;
    const invalidState = `${invalidValue}.${await signForTest(invalidValue)}`;

    const invalidResult = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConnectionStateService;
        return yield* service.verify(invalidState).pipe(Effect.result);
      }).pipe(Effect.provide(StateLayer))
    );
    vi.advanceTimersByTime(11 * 60 * 1000);
    const expiredResult = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConnectionStateService;
        return yield* service.verify(state).pipe(Effect.result);
      }).pipe(Effect.provide(StateLayer))
    );
    const expiredTransfer = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ConnectionStateService;
        return yield* service.verifyTransfer(transferToken).pipe(Effect.result);
      }).pipe(Effect.provide(StateLayer))
    );

    expect(invalidResult._tag).toBe("Failure");
    expect(expiredResult._tag).toBe("Failure");
    expect(expiredTransfer._tag).toBe("Failure");
  });
});
