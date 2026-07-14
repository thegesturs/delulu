import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectMutation, effectQuery } from "../query.js";
import {
  defineResourceOptions,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type TransactionsQuery = EndpointQuery<
  ApiClient["billing"]["transactions"]
>;

export const createBillingOptions = defineResourceOptions(
  ({ client, runner }) => ({
    subscription: (workspaceId: string) =>
      effectQuery({
        queryKey: workspaceKeys.resource(workspaceId, "billing-subscription"),
        effect: () => client.billing.subscription({ params: { workspaceId } }),
        runner,
      }),
    usage: (workspaceId: string) =>
      effectQuery({
        queryKey: workspaceKeys.resource(workspaceId, "billing-usage"),
        effect: () => client.billing.usage({ params: { workspaceId } }),
        runner,
      }),
    checkout: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "billing-checkout"),
        effect: (payload: EndpointPayload<ApiClient["billing"]["checkout"]>) =>
          client.billing.checkout({ params: { workspaceId }, payload }),
        runner,
      }),
    transactions: (workspaceId: string, query: TransactionsQuery = {}) =>
      effectQuery({
        queryKey: workspaceKeys.list(
          workspaceId,
          "billing-transactions",
          query
        ),
        effect: () =>
          client.billing.transactions({ params: { workspaceId }, query }),
        runner,
      }),
    transfers: (workspaceId: string) =>
      effectQuery({
        queryKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
        effect: () => client.billing.transfers({ params: { workspaceId } }),
        runner,
      }),
    requestTransfer: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
        effect: (
          payload: EndpointPayload<ApiClient["billing"]["requestTransfer"]>
        ) =>
          client.billing.requestTransfer({ params: { workspaceId }, payload }),
        runner,
      }),
    acceptTransfer: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
        effect: (id: string) =>
          client.billing.acceptTransfer({ params: { workspaceId, id } }),
        runner,
      }),
    cancelTransfer: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "billing-transfers"),
        effect: (id: string) =>
          client.billing.cancelTransfer({ params: { workspaceId, id } }),
        runner,
      }),
  })
);
