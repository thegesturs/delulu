import type {
  Automation,
  AutomationStep,
  AutomationTrigger,
} from "@delulu/core/domain/automation";
import type { AutomationEvent } from "@delulu/core/domain/automation-event";
import {
  type AutomationId,
  AutomationRunId,
  makeId,
} from "@delulu/core/kernel/ids";
import { Context, DateTime, Effect, Layer, Schema } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { AutomationSessionService } from "./automation-sessions";
import { AutomationService } from "./automations";
import { DmDispatchService } from "./dm-dispatch";

export class ProviderAudienceError extends Schema.TaggedErrorClass<ProviderAudienceError>()(
  "ProviderAudienceError",
  { message: Schema.String, retryable: Schema.Boolean }
) {}
export class ProviderAudienceService extends Context.Service<
  ProviderAudienceService,
  {
    readonly isFollower: (input: {
      readonly connectionId: string;
      readonly platformUserId: string;
    }) => Effect.Effect<boolean, ProviderAudienceError>;
  }
>()("@delulu/services/ProviderAudienceService") {}

export class AutomationEvaluationError extends Schema.TaggedErrorClass<AutomationEvaluationError>()(
  "AutomationEvaluationError",
  { eventId: Schema.String, message: Schema.String, retryable: Schema.Boolean }
) {}

export const keywordMatches = (
  trigger: AutomationTrigger,
  text: string
): boolean => {
  const filter = trigger.keywordFilter;
  if (!filter || filter.operator === "always") {
    return true;
  }
  const candidate = filter.caseSensitive ? text : text.toLocaleLowerCase();
  const expectedRaw = filter.value ?? "";
  const expected = filter.caseSensitive
    ? expectedRaw
    : expectedRaw.toLocaleLowerCase();
  switch (filter.operator) {
    case "contains":
      return candidate.includes(expected);
    case "not_contains":
      return !candidate.includes(expected);
    case "equals":
      return candidate === expected;
    case "starts_with":
      return candidate.startsWith(expected);
    case "ends_with":
      return candidate.endsWith(expected);
    case "regex": {
      if (expectedRaw.length > 256) {
        return false;
      }
      try {
        return new RegExp(expectedRaw, filter.caseSensitive ? "" : "i").test(
          text
        );
      } catch {
        return false;
      }
    }
    default:
      return true;
  }
};

const render = (template: string, event: AutomationEvent) =>
  template
    .replaceAll("{{username}}", event.platformUsername ?? "there")
    .replaceAll("{{text}}", event.text ?? "");

const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/;
const emailFrom = (value: string | undefined): string | undefined =>
  value?.match(EMAIL_PATTERN)?.[0];

export class AutomationEngine extends Context.Service<
  AutomationEngine,
  {
    readonly evaluate: (event: AutomationEvent) => Effect.Effect<
      {
        readonly evaluated: number;
        readonly sent: number;
        readonly skipped: number;
      },
      AutomationEvaluationError
    >;
  }
>()("@delulu/services/AutomationEngine") {
  static readonly layer = Layer.effect(
    AutomationEngine,
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;
      const automations = yield* AutomationService;
      const sessions = yield* AutomationSessionService;
      const dispatch = yield* DmDispatchService;
      const audience = yield* ProviderAudienceService;

      const hasEmail = Effect.fn("AutomationEngine.hasEmail")(function* (
        automationId: AutomationId,
        platformUserId: string
      ) {
        const rows = yield* sql<{
          present: boolean;
        }>`SELECT EXISTS(SELECT 1 FROM automation_contacts WHERE automation_id = ${automationId} AND platform_user_id = ${platformUserId} AND email IS NOT NULL) AS present`;
        return rows[0]?.present ?? false;
      });
      const condition = Effect.fn("AutomationEngine.condition")(function* (
        automation: Automation,
        step: Extract<AutomationStep, { type: "condition" }>,
        event: AutomationEvent
      ) {
        if (step.operator === "is_follower") {
          return yield* audience.isFollower({
            connectionId: automation.connectionId,
            platformUserId: event.platformUserId,
          });
        }
        if (step.operator === "has_email") {
          return yield* hasEmail(automation.id, event.platformUserId);
        }
        return keywordMatches(
          {
            id: step.id,
            type: "trigger",
            triggerType: "comment",
            targetPostIds: [],
            keywordFilter: {
              operator: step.operator,
              value: step.value,
              caseSensitive: step.caseSensitive,
            },
          },
          event.text ?? ""
        );
      });
      const recordRun = Effect.fn("AutomationEngine.recordRun")(function* (
        automation: Automation,
        event: AutomationEvent,
        status: string,
        output: Readonly<Record<string, unknown>>,
        failure: string | null,
        startedAt: DateTime.Utc
      ) {
        const completedAt = yield* DateTime.now;
        yield* sql`INSERT INTO automation_runs (id, workspace_id, automation_id, status, input, output, error, started_at, completed_at) VALUES (${makeId(AutomationRunId)}, ${automation.workspaceId}, ${automation.id}, ${status}, ${JSON.stringify(event)}::jsonb, ${JSON.stringify(output)}::jsonb, ${failure}, ${DateTime.toDateUtc(startedAt)}, ${DateTime.toDateUtc(completedAt)}`;
      });

      const execute = Effect.fn("AutomationEngine.execute")(function* (
        automation: Automation,
        event: AutomationEvent,
        firstStepId: string | undefined
      ) {
        const startedAt = yield* DateTime.now;
        let currentId = firstStepId;
        let sent = 0;
        let skipped = 0;
        let stepsVisited = 0;
        const byId = new Map(automation.steps.map((step) => [step.id, step]));
        while (currentId && stepsVisited < 32) {
          stepsVisited += 1;
          const step = byId.get(currentId);
          if (!step) {
            break;
          }
          if (step.type === "condition") {
            const yes = yield* condition(automation, step, event);
            currentId = yes ? step.yesStepId : step.noStepId;
            continue;
          }
          const result = yield* dispatch.sendOnce({
            provider: "meta",
            eventId: event.eventId,
            automationId: automation.id,
            connectionId: automation.connectionId,
            recipientId: event.platformUserId,
            stepId: step.id,
            message: render(step.messageTemplate, event),
            buttons: step.buttons ?? [],
          });
          if (result._tag === "Sent") {
            sent += 1;
          }
          if (result._tag === "Skipped") {
            skipped += 1;
          }
          const waitsForReply = (step.buttons ?? []).some(
            (button) => button.type === "quick_reply"
          );
          if (waitsForReply) {
            yield* sessions.start({
              workspaceId: automation.workspaceId,
              automationId: automation.id,
              profileId: event.profileId,
              platformUserId: event.platformUserId,
              platformUsername: event.platformUsername ?? null,
              currentStepId: step.id,
              triggerEventId: event.eventId,
              triggerMediaId:
                event._tag === "CommentReceived" ? event.mediaId : null,
              variables: {},
            });
            break;
          }
          currentId = step.nextStepId;
        }
        if (stepsVisited >= 32) {
          return yield* new AutomationEvaluationError({
            eventId: event.eventId,
            message: "Automation step limit exceeded",
            retryable: false,
          });
        }
        const email = emailFrom(event.text);
        if (email) {
          yield* sessions.upsertContact({
            workspaceId: automation.workspaceId,
            automationId: automation.id,
            platformUserId: event.platformUserId,
            email,
          });
        }
        yield* recordRun(
          automation,
          event,
          skipped > 0 && sent === 0 ? "skipped" : "completed",
          { sent, skipped, stepsVisited },
          null,
          startedAt
        );
        return { sent, skipped };
      });

      const evaluate = Effect.fn("AutomationEngine.evaluate")(function* (
        event: AutomationEvent
      ) {
        if (event._tag === "MessageReceived") {
          const session = yield* sessions
            .findActive(event.profileId, event.platformUserId)
            .pipe(
              Effect.mapError(
                () =>
                  new AutomationEvaluationError({
                    eventId: event.eventId,
                    message: "Unable to load automation session",
                    retryable: true,
                  })
              )
            );
          if (!session) {
            return { evaluated: 0, sent: 0, skipped: 0 };
          }
          const automation = yield* automations
            .get(session.workspaceId, session.automationId)
            .pipe(
              Effect.mapError(
                () =>
                  new AutomationEvaluationError({
                    eventId: event.eventId,
                    message: "Unable to load session automation",
                    retryable: true,
                  })
              )
            );
          const current = automation.steps.find(
            (step) => step.id === session.currentStepId
          );
          const selectedButton =
            current?.type === "send_dm"
              ? current.buttons?.find(
                  (button) =>
                    button.type === "quick_reply" &&
                    button.payload === event.quickReplyPayload
                )
              : undefined;
          const next =
            current?.type === "send_dm"
              ? ((selectedButton?.type === "quick_reply"
                  ? selectedButton.nextStepId
                  : undefined) ?? current.nextStepId)
              : undefined;
          const result = yield* execute(automation, event, next).pipe(
            Effect.mapError((failure) =>
              failure._tag === "AutomationEvaluationError"
                ? failure
                : new AutomationEvaluationError({
                    eventId: event.eventId,
                    message: "Automation execution failed",
                    retryable: true,
                  })
            )
          );
          yield* sessions
            .advance({
              session,
              profileId: event.profileId,
              currentStepId: next ?? session.currentStepId,
              completed: next === undefined,
              variables: session.variables,
            })
            .pipe(
              Effect.mapError(
                () =>
                  new AutomationEvaluationError({
                    eventId: event.eventId,
                    message: "Unable to advance automation session",
                    retryable: true,
                  })
              )
            );
          return { evaluated: 1, ...result };
        }
        const found = yield* automations
          .findForTrigger(event.profileId, event.mediaId)
          .pipe(
            Effect.mapError(
              () =>
                new AutomationEvaluationError({
                  eventId: event.eventId,
                  message: "Unable to resolve automation triggers",
                  retryable: true,
                })
            )
          );
        let sent = 0;
        let skipped = 0;
        let evaluated = 0;
        for (const automation of found) {
          const trigger = automation.triggers.find(
            (item) =>
              item.triggerType === event.triggerType &&
              item.targetPostIds.includes(event.mediaId) &&
              keywordMatches(item, event.text)
          );
          if (!trigger) {
            continue;
          }
          evaluated += 1;
          const result = yield* execute(
            automation,
            event,
            trigger.nextStepId
          ).pipe(
            Effect.mapError((failure) =>
              failure._tag === "AutomationEvaluationError"
                ? failure
                : new AutomationEvaluationError({
                    eventId: event.eventId,
                    message: "Automation execution failed",
                    retryable: true,
                  })
            )
          );
          sent += result.sent;
          skipped += result.skipped;
        }
        return { evaluated, sent, skipped };
      });
      return AutomationEngine.of({ evaluate });
    })
  );
}
