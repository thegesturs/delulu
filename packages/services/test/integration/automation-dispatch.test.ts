import { PgClient } from "@effect/sql-pg";
import { Effect, String as EffectString, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { describe, expect, it } from "vitest";
import { DeploymentConfig } from "../../src/deployment";
import {
  DmDispatchService,
  ProviderDmError,
  ProviderDmService,
} from "../../src/dm-dispatch";
import { EntitlementPolicy } from "../../src/entitlements";
import { IdentityService } from "../../src/identity";
import { provisionPaidSubscription } from "./paid-subscription";

const Pg = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

const layerFor = (send: ProviderDmService["Type"]["send"]) => {
  const Provider = Layer.succeed(
    ProviderDmService,
    ProviderDmService.of({ send })
  );
  const Entitlements = EntitlementPolicy.layer.pipe(
    Layer.provide(
      DeploymentConfig.layer({
        mode: "hosted",
        publishTransport: "sqs",
        registrationEnabled: true,
        version: "test",
        communityApiRatePerMinute: 120,
      })
    )
  );
  const Dispatch = DmDispatchService.layer.pipe(
    Layer.provide(Provider),
    Layer.provide(Entitlements)
  );
  return Layer.mergeAll(IdentityService.layer, Dispatch).pipe(
    Layer.provideMerge(Pg)
  );
};

const seededInput = Effect.gen(function* () {
  const identity = yield* IdentityService;
  const sql = yield* SqlClient.SqlClient;
  const resolved = yield* identity.resolve({
    sub: `automation_dispatch_${crypto.randomUUID()}`,
  });
  const workspaceId = resolved.personalWorkspace!.id;
  yield* provisionPaidSubscription(resolved.user.id);
  const connectionId = `connection_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const automationId = `automation_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
  yield* sql`INSERT INTO connections
    (id, workspace_id, platform, profile_id, access_token, cipher_version)
    VALUES (${connectionId}, ${workspaceId}, 'INSTAGRAM',
      ${`profile_${crypto.randomUUID()}`}, 'opaque', 'v1')`;
  yield* sql`INSERT INTO automations
    (id, workspace_id, connection_id, platform, category, name)
    VALUES (${automationId}, ${workspaceId}, ${connectionId}, 'instagram',
      'comment', 'Dispatch integration')`;
  return {
    provider: "meta" as const,
    eventId: `event_${crypto.randomUUID()}`,
    automationId,
    stepId: "step_1",
    connectionId,
    recipientId: `recipient_${crypto.randomUUID()}`,
    message: "Hello",
    buttons: [],
    billingOwnerUserId: resolved.user.id,
  };
});

describe("automation DM dispatch", () => {
  it("sends exactly once and commits quota atomically", async () => {
    let sends = 0;
    const layer = layerFor(() => {
      sends += 1;
      return Effect.succeed({ messageId: `message_${sends}` });
    });
    const program = Effect.gen(function* () {
      const dispatch = yield* DmDispatchService;
      const sql = yield* SqlClient.SqlClient;
      const input = yield* seededInput;
      const first = yield* dispatch.sendOnce(input);
      const duplicate = yield* dispatch.sendOnce(input);
      const counters = yield* sql<{ sent: string; reserved: string }>`SELECT
        dms_sent::text AS sent, dms_reserved::text AS reserved
        FROM subscriptions
        WHERE billing_owner_user_id = ${input.billingOwnerUserId}`;
      return { first, duplicate, counters: counters[0] };
    });
    const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
    expect(result.first._tag).toBe("Sent");
    expect(result.duplicate._tag).toBe("Duplicate");
    expect(sends).toBe(1);
    expect(result.counters).toEqual({ sent: "1", reserved: "0" });
  });

  it.each([
    ["not_sent" as const, "failed", "0"],
    ["unknown" as const, "ambiguous", "1"],
  ])("records provider %s failures without leaving quota reserved", async (deliveryState, expectedStatus, expectedSent) => {
    const layer = layerFor(() =>
      Effect.fail(
        new ProviderDmError({
          message: "provider timeout",
          retryable: true,
          deliveryState,
        })
      )
    );
    const program = Effect.gen(function* () {
      const dispatch = yield* DmDispatchService;
      const sql = yield* SqlClient.SqlClient;
      const input = yield* seededInput;
      const outcome = yield* dispatch.sendOnce(input).pipe(Effect.result);
      const rows = yield* sql<{
        status: string;
        sent: string;
        reserved: string;
      }>`SELECT d.status, s.dms_sent::text AS sent,
          s.dms_reserved::text AS reserved
          FROM automation_dm_dispatches d
          JOIN automations a ON a.id = d.automation_id
          JOIN workspaces w ON w.id = a.workspace_id
          JOIN subscriptions s ON s.billing_owner_user_id = w.billing_owner_user_id
          WHERE d.event_id = ${input.eventId}`;
      return { outcome, row: rows[0] };
    });
    const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
    expect(result.outcome._tag).toBe("Failure");
    expect(result.row).toEqual({
      status: expectedStatus,
      sent: expectedSent,
      reserved: "0",
    });
  });
});
