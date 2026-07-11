import { ConflictError, type NotFoundError } from "@delulu/contracts";
import { AutomationsGroup } from "@delulu/contracts/src/automations";
import { CurrentAuth } from "@delulu/core";
import {
  type Automation,
  AutomationPersistenceError,
} from "@delulu/core/domain/automation";
import { timestampToWire } from "@delulu/core/kernel/time";
import { WorkspaceAccessService } from "@delulu/services";
import { AutomationService } from "@delulu/services/src/automations";
import { Effect, Layer } from "effect";
import { HttpApi, HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthenticationLive } from "./auth-middleware";

export const AutomationApi =
  HttpApi.make("automationApi").add(AutomationsGroup);

const page = (query: {
  readonly limit?: number;
  readonly offset?: number;
}) => ({
  limit: Math.min(100, Math.max(1, query.limit ?? 20)),
  offset: Math.max(0, query.offset ?? 0),
});

const view = (automation: Automation) => ({
  id: automation.id,
  workspaceId: automation.workspaceId,
  connectionId: automation.connectionId,
  platform: automation.platform,
  category: automation.category,
  name: automation.name,
  description: automation.description,
  enabled: automation.enabled,
  triggers: automation.triggers,
  steps: automation.steps,
  notes: automation.notes,
  nodePositions: automation.nodePositions,
  totalTriggered: automation.totalTriggered,
  totalDmsSent: automation.totalDmsSent,
  totalFailed: automation.totalFailed,
  createdAt: timestampToWire(automation.createdAt),
  updatedAt: timestampToWire(automation.updatedAt),
});

const exposePersistence = <A>(
  effect: Effect.Effect<A, AutomationPersistenceError | NotFoundError>
): Effect.Effect<A, ConflictError | NotFoundError> =>
  effect.pipe(
    Effect.catchIf(
      (error): error is AutomationPersistenceError =>
        error instanceof AutomationPersistenceError,
      (error) =>
        new ConflictError({ message: error.message, resource: "automation" })
    )
  );

export const AutomationHandlers = HttpApiBuilder.group(
  AutomationApi,
  "automations",
  Effect.fnUntraced(function* (handlers) {
    const service = yield* AutomationService;
    const workspaces = yield* WorkspaceAccessService;
    const requireAccess = Effect.fn("AutomationHandlers.requireAccess")(
      function* (
        workspaceId: string,
        scope: "accounts:read" | "accounts:write"
      ) {
        const auth = yield* CurrentAuth;
        return yield* workspaces.require({ workspaceId, auth, scope });
      }
    );
    return handlers
      .handle(
        "list",
        Effect.fn("AutomationHandlers.list")(function* ({ params, query }) {
          const access = yield* requireAccess(
            params.workspaceId,
            "accounts:read"
          );
          const paging = page(query);
          const result = yield* exposePersistence(
            service.list(
              access.workspaceId,
              paging.limit,
              paging.offset,
              params.platform,
              params.category
            )
          );
          return { ...result, data: result.data.map(view) };
        })
      )
      .handle(
        "create",
        Effect.fn("AutomationHandlers.create")(function* ({ params, payload }) {
          const access = yield* requireAccess(
            params.workspaceId,
            "accounts:write"
          );
          return view(
            yield* exposePersistence(
              service.create(access.workspaceId, {
                ...payload,
                platform: params.platform,
                category: params.category,
              })
            )
          );
        })
      )
      .handle(
        "get",
        Effect.fn("AutomationHandlers.get")(function* ({ params }) {
          const access = yield* requireAccess(
            params.workspaceId,
            "accounts:read"
          );
          return view(
            yield* exposePersistence(
              service.get(
                access.workspaceId,
                params.id,
                params.platform,
                params.category
              )
            )
          );
        })
      )
      .handle(
        "update",
        Effect.fn("AutomationHandlers.update")(function* ({ params, payload }) {
          const access = yield* requireAccess(
            params.workspaceId,
            "accounts:write"
          );
          yield* exposePersistence(
            service.get(
              access.workspaceId,
              params.id,
              params.platform,
              params.category
            )
          );
          return view(
            yield* exposePersistence(
              service.update(access.workspaceId, params.id, payload)
            )
          );
        })
      )
      .handle(
        "remove",
        Effect.fn("AutomationHandlers.remove")(function* ({ params }) {
          const access = yield* requireAccess(
            params.workspaceId,
            "accounts:write"
          );
          yield* exposePersistence(
            service.get(
              access.workspaceId,
              params.id,
              params.platform,
              params.category
            )
          );
          yield* exposePersistence(
            service.remove(access.workspaceId, params.id)
          );
          return { deleted: true };
        })
      )
      .handle(
        "runs",
        Effect.fn("AutomationHandlers.runs")(function* ({ params, query }) {
          const access = yield* requireAccess(
            params.workspaceId,
            "accounts:read"
          );
          const paging = page(query);
          return yield* exposePersistence(
            service.listRuns(
              access.workspaceId,
              paging.limit,
              paging.offset,
              params.platform,
              params.category,
              query.automationId
            )
          );
        })
      )
      .handle(
        "inbox",
        Effect.fn("AutomationHandlers.inbox")(function* ({ params, query }) {
          const access = yield* requireAccess(
            params.workspaceId,
            "accounts:read"
          );
          const paging = page(query);
          return yield* exposePersistence(
            service.inbox(
              access.workspaceId,
              paging.limit,
              paging.offset,
              params.platform,
              params.category
            )
          );
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));
