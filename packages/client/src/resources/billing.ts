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
    portal: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "billing-portal"),
        effect: () => client.billing.portal({ params: { workspaceId } }),
        runner,
      }),
    checkout: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "billing-checkout"),
        effect: (payload: EndpointPayload<ApiClient["billing"]["checkout"]>) =>
          client.billing.checkout({ params: { workspaceId }, payload }),
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
    cancellation: (workspaceId: string) =>
      effectQuery({
        queryKey: workspaceKeys.resource(workspaceId, "billing-cancellation"),
        effect: () => client.billing.cancellation({ params: { workspaceId } }),
        runner,
      }),
    startCancellation: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(
          workspaceId,
          "billing-cancellation-start"
        ),
        effect: (
          payload: EndpointPayload<ApiClient["billing"]["startCancellation"]>
        ) =>
          client.billing.startCancellation({
            params: { workspaceId },
            payload,
          }),
        runner,
      }),
    acceptCancellationOffer: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(
          workspaceId,
          "billing-cancellation-offer"
        ),
        effect: (id: string) =>
          client.billing.acceptCancellationOffer({
            params: { workspaceId, id },
          }),
        runner,
      }),
    scheduleCancellation: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(
          workspaceId,
          "billing-cancellation-schedule"
        ),
        effect: (input: {
          readonly id: string;
          readonly confirmation: string;
        }) =>
          client.billing.scheduleCancellation({
            params: { workspaceId, id: input.id },
            payload: { confirmation: input.confirmation },
          }),
        runner,
      }),
    reactivateCancellation: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(
          workspaceId,
          "billing-cancellation-reactivate"
        ),
        effect: (id: string) =>
          client.billing.reactivateCancellation({
            params: { workspaceId, id },
          }),
        runner,
      }),
    abandonCancellation: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(
          workspaceId,
          "billing-cancellation-abandon"
        ),
        effect: (id: string) =>
          client.billing.abandonCancellation({ params: { workspaceId, id } }),
        runner,
      }),
  })
);
