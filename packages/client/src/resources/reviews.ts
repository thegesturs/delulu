import { Effect } from "effect";
import type { ApiClient } from "../client.js";
import { workspaceKeys } from "../keys.js";
import { mutationEffect, resourceEffect } from "../resource.js";
import {
  defineResourceEffects,
  type EndpointPayload,
  type EndpointQuery,
} from "./shared.js";

export type ReviewsPageQuery = EndpointQuery<ApiClient["reviews"]["queue"]>;

export const createReviewEffects = defineResourceEffects(({ client }) => ({
  queue: (workspaceId: string, query: ReviewsPageQuery = {}) =>
    resourceEffect({
      queryKey: workspaceKeys.list(workspaceId, "reviews", query),
      effect: () => client.reviews.queue({ params: { workspaceId }, query }),
    }),
  forPost: (workspaceId: string, postId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.detail(workspaceId, "post-reviews", postId),
      effect: () =>
        client.reviews.getForPost({ params: { workspaceId, postId } }),
    }),
  activity: (workspaceId: string, postId: string) =>
    resourceEffect({
      queryKey: workspaceKeys.detail(workspaceId, "review-activity", postId),
      effect: () =>
        client.reviews.activity({ params: { workspaceId, postId } }),
    }),
  act: (workspaceId: string, postId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.detail(workspaceId, "post-reviews", postId),
      invalidates: [
        workspaceKeys.resource(workspaceId, "reviews"),
        workspaceKeys.resource(workspaceId, "post-reviews"),
        workspaceKeys.resource(workspaceId, "review-activity"),
        workspaceKeys.resource(workspaceId, "posts"),
      ],
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
    }),
  bulkAct: (workspaceId: string) =>
    mutationEffect({
      mutationKey: workspaceKeys.resource(workspaceId, "reviews"),
      invalidates: [
        workspaceKeys.resource(workspaceId, "reviews"),
        workspaceKeys.resource(workspaceId, "post-reviews"),
        workspaceKeys.resource(workspaceId, "review-activity"),
        workspaceKeys.resource(workspaceId, "posts"),
      ],
      effect: (payload: EndpointPayload<ApiClient["reviews"]["bulkAct"]>) =>
        client.reviews.bulkAct({ params: { workspaceId }, payload }),
    }),
}));
