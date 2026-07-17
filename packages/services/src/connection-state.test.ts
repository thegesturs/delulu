import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { ConnectionStateConfig, ConnectionStateService } from "./connections";

const StateLayer = ConnectionStateService.layer.pipe(
  Layer.provide(
    Layer.succeed(
      ConnectionStateConfig,
      ConnectionStateConfig.of({ secret: "test-secret-with-enough-entropy" })
    )
  )
);

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
      const tamperedClient = yield* service
        .verify(cliState.replace(".cli.", ".mcp."))
        .pipe(Effect.result);
      const tampered = yield* service
        .verify(state.replace("workspace_", "workspacz_"))
        .pipe(Effect.result);
      return { verified, cliVerified, tampered, tamperedClient };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(StateLayer))
    );
    expect(result.verified.workspaceId).toBe("workspace_aaaaaaaaaaaa");
    expect(result.verified.principal).toBe("u:user_aaaaaaaaaaaa");
    expect(result.verified.client).toBeUndefined();
    expect(result.cliVerified.client).toBe("cli");
    expect(result.tampered._tag).toBe("Failure");
    expect(result.tamperedClient._tag).toBe("Failure");
  });
});
