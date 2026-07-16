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
  portal: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "billing-portal"),
      effect: () => client.billing.portal({ params: { workspaceId } }),
    }),
  checkout: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "billing-checkout"),
      effect: (payload: EndpointPayload<ApiClient["billing"]["checkout"]>) =>
        client.billing.checkout({ params: { workspaceId }, payload }),
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
  cancellation: (workspaceId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.resource(workspaceId, "billing-cancellation"),
      effect: () => client.billing.cancellation({ params: { workspaceId } }),
    }),
  startCancellation: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(
        workspaceId,
        "billing-cancellation-start"
      ),
      invalidates: [
        workspaceKeys.resource(workspaceId, "billing-cancellation"),
      ],
      effect: (
        payload: EndpointPayload<ApiClient["billing"]["startCancellation"]>
      ) =>
        client.billing.startCancellation({
          params: { workspaceId },
          payload,
        }),
    }),
  acceptCancellationOffer: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(
        workspaceId,
        "billing-cancellation-offer"
      ),
      invalidates: [
        workspaceKeys.resource(workspaceId, "billing-cancellation"),
      ],
      effect: (id: string) =>
        client.billing.acceptCancellationOffer({
          params: { workspaceId, id },
        }),
    }),
  scheduleCancellation: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(
        workspaceId,
        "billing-cancellation-schedule"
      ),
      invalidates: [
        workspaceKeys.resource(workspaceId, "billing-cancellation"),
      ],
      effect: (input: { readonly id: string; readonly confirmation: string }) =>
        client.billing.scheduleCancellation({
          params: { workspaceId, id: input.id },
          payload: { confirmation: input.confirmation },
        }),
    }),
  reactivateCancellation: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(
        workspaceId,
        "billing-cancellation-reactivate"
      ),
      invalidates: [
        workspaceKeys.resource(workspaceId, "billing-cancellation"),
      ],
      effect: (id: string) =>
        client.billing.reactivateCancellation({
          params: { workspaceId, id },
        }),
    }),
  abandonCancellation: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(
        workspaceId,
        "billing-cancellation-abandon"
      ),
      invalidates: [
        workspaceKeys.resource(workspaceId, "billing-cancellation"),
      ],
      effect: (id: string) =>
        client.billing.abandonCancellation({ params: { workspaceId, id } }),
    }),
}));
