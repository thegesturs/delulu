import { Effect } from "effect";
import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { effectMutation, effectQuery } from "../query.js";
import {
  defineResourceOptions,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type ReviewsPageQuery = EndpointQuery<ApiClient["reviews"]["queue"]>;

export const createReviewOptions = defineResourceOptions(
  ({ client, runner }) => ({
    queue: (workspaceId: string, query: ReviewsPageQuery = {}) =>
      effectQuery({
        queryKey: workspaceKeys.list(workspaceId, "reviews", query),
        effect: () => client.reviews.queue({ params: { workspaceId }, query }),
        runner,
      }),
    forPost: (workspaceId: string, postId: string) =>
      effectQuery({
        queryKey: workspaceKeys.detail(workspaceId, "post-reviews", postId),
        effect: () =>
          client.reviews.getForPost({ params: { workspaceId, postId } }),
        runner,
      }),
    activity: (workspaceId: string, postId: string) =>
      effectQuery({
        queryKey: workspaceKeys.detail(workspaceId, "review-activity", postId),
        effect: () =>
          client.reviews.activity({ params: { workspaceId, postId } }),
        runner,
      }),
    act: (workspaceId: string, postId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.detail(workspaceId, "post-reviews", postId),
        effect: (payload: EndpointPayload<ApiClient["reviews"]["act"]>) => {
          const params = { workspaceId, postId };
          switch (payload.action) {
            case "submit":
              return client.reviews.act({ params, payload });
            case "approve":
              return client.reviews.act({ params, payload });
            case "reject":
              return client.reviews.act({ params, payload });
            case "withdraw":
              return client.reviews.act({ params, payload });
            case "comment":
              return client.reviews.act({ params, payload });
            default:
              return Effect.die(new Error("Unsupported review action"));
          }
        },
        runner,
      }),
    bulkAct: (workspaceId: string) =>
      effectMutation({
        mutationKey: workspaceKeys.resource(workspaceId, "reviews"),
        effect: (payload: EndpointPayload<ApiClient["reviews"]["bulkAct"]>) =>
          client.reviews.bulkAct({ params: { workspaceId }, payload }),
        runner,
      }),
  })
);
