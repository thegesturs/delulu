import { AutomationId, makeId } from "@delulu/core";
import { AutomationSessionId } from "@delulu/core/domain/automation-session";
import { Effect, Layer, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { AutomationKvService } from "./automation-kv";

const layer = AutomationKvService.layer.pipe(
  Layer.provide(AutomationKvService.memoryLayer())
);

describe("automation KV abstraction", () => {
  it("round-trips trigger and session cache values", async () => {
    const automationId = makeId(AutomationId);
    const sessionId = Schema.decodeUnknownSync(AutomationSessionId)(
      "automation_session_test"
    );
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const kv = yield* AutomationKvService;
        yield* kv.putTriggerIds("profile-1", "media-1", [automationId]);
        yield* kv.putAllTriggerIds("profile-1", [automationId]);
        yield* kv.putSession({
          profileId: "profile-1",
          automationId,
          platformUserId: "visitor-1",
          sessionId,
        });
        return {
          triggers: yield* kv.getTriggerIds("profile-1", "media-1"),
          allTriggers: yield* kv.getAllTriggerIds("profile-1"),
          session: yield* kv.getSession("profile-1", "visitor-1"),
        };
      }).pipe(Effect.provide(layer))
    );
    expect(result.triggers).toEqual([automationId]);
    expect(result.allTriggers).toEqual([automationId]);
    expect(result.session).toBe(sessionId);
  });

  it("does not retain misses that could hide newly resolved media", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const kv = yield* AutomationKvService;
        yield* kv.putTriggerIds("profile-2", "media-2", []);
        return yield* kv.getTriggerIds("profile-2", "media-2");
      }).pipe(Effect.provide(layer))
    );
    expect(result).toBeNull();
  });
});
