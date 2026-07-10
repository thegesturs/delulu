import { Api } from "@delulu/contracts";
import { CurrentAuth } from "@delulu/core";
import { IdentityService, MembershipService } from "@delulu/services";
import { DateTime, Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { SqlClient } from "effect/unstable/sql";
import { AuthenticationLive } from "./auth-middleware";

/** `GET /health` — liveness plus a `SELECT 1` database probe. */
export const HealthHandlers = HttpApiBuilder.group(
  Api,
  "health",
  Effect.fnUntraced(function* (handlers) {
    return handlers.handle("check", () =>
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient;
        yield* sql`SELECT 1`.pipe(Effect.orDie);
        const checkedAt = yield* DateTime.now;
        return { status: "ok" as const, checkedAt };
      })
    );
  })
);

/** `GET /v1/me` and `GET /v1/me/workspaces` — the identity tier. */
export const MeHandlers = HttpApiBuilder.group(
  Api,
  "me",
  Effect.fnUntraced(function* (handlers) {
    const identity = yield* IdentityService;
    const membership = yield* MembershipService;

    return handlers
      .handle("current", () =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const resolved = yield* identity.resolveById(auth.userId);
          return {
            user: {
              id: resolved.user.id,
              externalId: resolved.user.externalId,
              email: resolved.user.email,
              name: resolved.user.name,
              imageUrl: resolved.user.imageUrl,
            },
            personalWorkspace: resolved.personalWorkspace
              ? {
                  id: resolved.personalWorkspace.id,
                  name: resolved.personalWorkspace.name,
                  slug: resolved.personalWorkspace.slug,
                }
              : null,
          };
        })
      )
      .handle("workspaces", () =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const rows = yield* membership.listForUser(auth.userId);
          return {
            data: rows,
            total: rows.length,
            limit: rows.length,
            offset: 0,
          };
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));
