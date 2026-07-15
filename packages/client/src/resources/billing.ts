import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import {
  defineResourceEffects,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type TransactionsQuery = EndpointQuery<
  ApiClient["billing"]["transactions"]
>;

export const createBillingEffects = defineResourceEffects(({ client }) => ({
  subscription: (workspaceId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.resource(workspaceId, "billing-subscription"),
      effect: () => client.billing.subscription({ params: { workspaceId } }),
    }),
  usage: (workspaceId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.resource(workspaceId, "billing-usage"),
      effect: () => client.billing.usage({ params: { workspaceId } }),
    }),
  transactions: (workspaceId: string, query: TransactionsQuery = {}) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "billing-transactions", query),
      effect: () =>
        client.billing.transactions({ params: { workspaceId }, query }),
    }),
  transfers: (workspaceId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
      effect: () => client.billing.transfers({ params: { workspaceId } }),
    }),
  requestTransfer: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
      effect: (
        payload: EndpointPayload<ApiClient["billing"]["requestTransfer"]>
      ) => client.billing.requestTransfer({ params: { workspaceId }, payload }),
    }),
  acceptTransfer: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
      effect: (id: string) =>
        client.billing.acceptTransfer({ params: { workspaceId, id } }),
    }),
  cancelTransfer: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
      effect: (id: string) =>
        client.billing.cancelTransfer({ params: { workspaceId, id } }),
    }),
}));
