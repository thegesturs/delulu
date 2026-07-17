import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import {
  defineResourceEffects,
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

export const createAutomationEffects = defineResourceEffects(({ client }) => ({
  list: (scope: AutomationScope, query: ListQuery = {}) =>
    resourceEffect({
      queryKey: key(scope, "automations", query),
      effect: () => client.automations.list({ params: params(scope), query }),
    }),
  get: (scope: AutomationScope, id: string) =>
    resourceEffect({
      queryKey: key(scope, "automations", "detail", id),
      effect: () =>
        client.automations.get({ params: { ...params(scope), id } }),
    }),
  runs: (scope: AutomationScope, query: RunsQuery = {}) =>
    resourceEffect({
      queryKey: key(scope, "automation-runs", query),
      effect: () => client.automations.runs({ params: params(scope), query }),
    }),
  inbox: (scope: AutomationScope, query: ListQuery = {}) =>
    resourceEffect({
      queryKey: key(scope, "automation-inbox", query),
      effect: () => client.automations.inbox({ params: params(scope), query }),
    }),
  create: (scope: AutomationScope) =>
    mutationEffect({
      mutationKey: key(scope, "automations"),
      effect: (payload: EndpointPayload<ApiClient["automations"]["create"]>) =>
        client.automations.create({ params: params(scope), payload }),
    }),
  update: (scope: AutomationScope, id: string) =>
    mutationEffect({
      mutationKey: key(scope, "automations", "detail", id),
      effect: (payload: EndpointPayload<ApiClient["automations"]["update"]>) =>
        client.automations.update({
          params: { ...params(scope), id },
          payload,
        }),
    }),
  remove: (scope: AutomationScope) =>
    mutationEffect({
      mutationKey: key(scope, "automations"),
      effect: (id: string) =>
        client.automations.remove({ params: { ...params(scope), id } }),
    }),
}));
