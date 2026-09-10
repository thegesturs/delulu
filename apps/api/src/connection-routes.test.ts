import {
  AuthConfig,
  ConnectionStateService,
  ConnectionsService,
  SetupService,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { describe, expect, it, vi } from "vitest";
import { ConnectionRoutes } from "./connection-routes";

const bodies = {
  facebook: { state: "signed", code: "code", pageId: "page", pageName: "Page" },
  linkedin: { state: "signed", selectionId: "selection", targetId: "member" },
};

function makeHandler(reconcileDefect = false) {
  const complete = vi.fn(() =>
    Effect.succeed({ status: "created", profileId: "member", name: "Member" })
  );
  const reconcile = vi.fn(() =>
    reconcileDefect
      ? Effect.die("setup unavailable")
      : Effect.fail("setup unavailable")
  );
  const dependencies = Layer.mergeAll(
    Layer.succeed(ConnectionsService, {
      completeFacebook: complete,
      completeLinkedIn: complete,
    } as unknown as ConnectionsService["Service"]),
    Layer.succeed(ConnectionStateService, {
      verify: () =>
        Effect.succeed({ principal: "u:user", workspaceId: "workspace" }),
    } as unknown as ConnectionStateService["Service"]),
    Layer.succeed(SetupService, {
      status: reconcile,
    } as unknown as SetupService["Service"]),
    Layer.succeed(AuthConfig, {
      clerkIssuer: "",
      clerkJwtKey: "",
      asIssuer: "",
      apiResource: "",
      appBaseUrl: "https://app.test",
    })
  );
  return {
    ...HttpRouter.toWebHandler(
      ConnectionRoutes.pipe(Layer.provide(dependencies)),
      { disableLogger: true }
    ),
    complete,
    reconcile,
  };
}

describe.each([
  "facebook",
  "linkedin",
] as const)("%s completion", (provider) => {
  it.each([
    "{",
    "{}",
    JSON.stringify({ ...bodies[provider], state: 42 }),
  ])("returns 400 for malformed input %s", async (body) => {
    const app = makeHandler();
    try {
      const response = await app.handler(
        new Request(`https://api.test/v1/connections/${provider}/complete`, {
          method: "POST",
          body,
        })
      );
      expect(response.status).toBe(400);
      expect(app.complete).not.toHaveBeenCalled();
    } finally {
      await app.dispose();
    }
  });

  it.each([
    false,
    true,
  ])("preserves committed success when reconciliation fails (defect=%s)", async (defect) => {
    const app = makeHandler(defect);
    try {
      const response = await app.handler(
        new Request(`https://api.test/v1/connections/${provider}/complete`, {
          method: "POST",
          body: JSON.stringify(bodies[provider]),
        })
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ status: "created" });
      expect(app.complete).toHaveBeenCalledOnce();
      expect(app.reconcile).toHaveBeenCalledOnce();
    } finally {
      await app.dispose();
    }
  });
});
