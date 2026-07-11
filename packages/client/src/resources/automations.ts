import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectMutation, effectQuery } from "../query.js";
import {
  defineResourceOptions,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export interface AutomationScope {
  readonly workspaceId: string;
  readonly platform: "instagram";
  readonly category: string;
}

type ListQuery = EndpointQuery<ApiClient["automations"]["list"]>;
type RunsQuery = EndpointQuery<ApiClient["automations"]["runs"]>;

const params = (scope: AutomationScope) => scope;
const key = (scope: AutomationScope, resource: string, ...parts: unknown[]) =>
  workspaceKeys.list(scope.workspaceId, resource, {
    platform: scope.platform,
    category: scope.category,
    parts,
  });

export const createAutomationOptions = defineResourceOptions(
  ({ client, runner }) => ({
    list: (scope: AutomationScope, query: ListQuery = {}) =>
      effectQuery({
        queryKey: key(scope, "automations", query),
        effect: () => client.automations.list({ params: params(scope), query }),
        runner,
      }),
    get: (scope: AutomationScope, id: string) =>
      effectQuery({
        queryKey: key(scope, "automations", "detail", id),
        effect: () =>
          client.automations.get({ params: { ...params(scope), id } }),
        runner,
      }),
    runs: (scope: AutomationScope, query: RunsQuery = {}) =>
      effectQuery({
        queryKey: key(scope, "automation-runs", query),
        effect: () => client.automations.runs({ params: params(scope), query }),
        runner,
      }),
    inbox: (scope: AutomationScope, query: ListQuery = {}) =>
      effectQuery({
        queryKey: key(scope, "automation-inbox", query),
        effect: () =>
          client.automations.inbox({ params: params(scope), query }),
        runner,
      }),
    create: (scope: AutomationScope) =>
      effectMutation({
        mutationKey: key(scope, "automations"),
        effect: (
          payload: EndpointPayload<ApiClient["automations"]["create"]>
        ) => client.automations.create({ params: params(scope), payload }),
        runner,
      }),
    update: (scope: AutomationScope, id: string) =>
      effectMutation({
        mutationKey: key(scope, "automations", "detail", id),
        effect: (
          payload: EndpointPayload<ApiClient["automations"]["update"]>
        ) =>
          client.automations.update({
            params: { ...params(scope), id },
            payload,
          }),
        runner,
      }),
    remove: (scope: AutomationScope) =>
      effectMutation({
        mutationKey: key(scope, "automations"),
        effect: (id: string) =>
          client.automations.remove({ params: { ...params(scope), id } }),
        runner,
      }),
  })
);
