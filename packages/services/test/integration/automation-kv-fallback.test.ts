import { AutomationId, ConnectionId, makeId } from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { describe, expect, it } from "vitest";
import {
  AutomationKvNamespace,
  AutomationKvService,
} from "../../src/automation-kv";
import { AutomationService } from "../../src/automations";
import { IdentityService } from "../../src/identity";
import { JobService } from "../../src/jobs";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

const serviceLayer = (namespace: Layer.Layer<AutomationKvNamespace>) => {
  const Kv = AutomationKvService.layer.pipe(Layer.provide(namespace));
  return AutomationService.layer.pipe(
    Layer.provide([
      Kv,
      Layer.succeed(
        JobService,
        JobService.of({
          enqueue: () => Effect.succeed("test"),
          cancel: () => Effect.void,
        })
      ),
    ]),
    Layer.provideMerge(Pg)
  );
};

describe("automation KV fallback", () => {
  it("keeps committed writes successful while durable repair still fails on KV outage", async () => {
    const namespace = Layer.succeed(
      AutomationKvNamespace,
      AutomationKvNamespace.of({
        get: async () => null,
        put: async () => {
          throw new Error("KV unavailable");
        },
        delete: async () => {
          throw new Error("KV unavailable");
        },
      })
    );
    const program = Effect.gen(function* () {
      const identity = yield* IdentityService;
      const automations = yield* AutomationService;
      const sql = yield* SqlClient.SqlClient;
      const user = yield* identity.resolve({
        sub: `kv-write-${crypto.randomUUID()}`,
      });
      const workspaceId = user.personalWorkspace!.id;
      const connectionId = makeId(ConnectionId);
      const profileId = `profile-${crypto.randomUUID()}`;
      yield* sql`INSERT INTO connections (id, workspace_id, platform, profile_id, access_token, cipher_version)
        VALUES (${connectionId}, ${workspaceId}, 'INSTAGRAM', ${profileId}, 'opaque', 'v1')`;
      const automation = yield* automations.create(workspaceId, {
        connectionId,
        platform: "instagram",
        category: "comment",
        name: "KV outage",
        triggers: [
          {
            id: "trigger",
            type: "trigger",
            triggerType: "comment",
            targetMode: "specific",
            targetPostIds: ["media"],
          },
        ],
        steps: [],
      });
      expect((yield* automations.get(workspaceId, automation.id)).id).toBe(
        automation.id
      );
      const repair = yield* automations
        .repairTrigger(profileId, "media")
        .pipe(Effect.exit);
      expect(repair._tag).toBe("Failure");
      yield* automations.remove(workspaceId, automation.id);
    });
    await Effect.runPromise(
      program.pipe(
        Effect.provide(
          Layer.mergeAll(
            serviceLayer(namespace),
            IdentityService.layer.pipe(Layer.provide(Pg))
          )
        )
      )
    );
  });
  it("falls back to Postgres on a KV outage", async () => {
    const namespace = Layer.succeed(
      AutomationKvNamespace,
      AutomationKvNamespace.of({
        get: async () => Promise.reject(new Error("KV unavailable")),
        put: async () => Promise.reject(new Error("KV unavailable")),
        delete: async () => Promise.reject(new Error("KV unavailable")),
      })
    );
    const program = Effect.gen(function* () {
      const automations = yield* AutomationService;
      return yield* automations.findForTrigger(
        `profile_${crypto.randomUUID()}`,
        `media_${crypto.randomUUID()}`
      );
    });
    await expect(
      Effect.runPromise(program.pipe(Effect.provide(serviceLayer(namespace))))
    ).resolves.toEqual([]);
  });

  it("filters stale KV automation ids against authoritative rows", async () => {
    const staleId = makeId(AutomationId);
    const namespace = AutomationKvService.memoryLayer({
      "automation:trigger:profile_stale:media_stale": JSON.stringify({
        automationIds: [staleId],
      }),
    });
    const program = Effect.gen(function* () {
      const automations = yield* AutomationService;
      return yield* automations.findForTrigger("profile_stale", "media_stale");
    });
    await expect(
      Effect.runPromise(program.pipe(Effect.provide(serviceLayer(namespace))))
    ).resolves.toEqual([]);
  });
});
