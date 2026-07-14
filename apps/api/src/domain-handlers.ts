import {
  API_KEY_CREATED,
  MEMBER_INVITED,
  POST_CREATED,
  POST_SAVED_AS_DRAFT,
  POST_SCHEDULED,
  POST_UPDATED,
  REVIEW_ACTIONED,
} from "@delulu/analytics/events";
import { Api } from "@delulu/contracts";
import { CurrentAuth } from "@delulu/core";
import {
  AdminService,
  ConnectionsService,
  MediaService,
  PostService,
  ProductAnalytics,
  ReviewService,
  WorkspaceAccessService,
  workspaceEvent,
} from "@delulu/services";
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthenticationLive } from "./auth-middleware";

/**
 * Map a freshly-created post's status to its lifecycle analytics event. This is
 * the single, cross-surface source for post-creation events: the dashboard, CLI,
 * MCP, and direct API all create through this handler, so capturing here (keyed
 * on `post.source`) avoids the double-counting that a parallel client-side event
 * would cause.
 */
const postCreateEvent = (status: string): string => {
  if (status === "scheduled") {
    return POST_SCHEDULED;
  }
  if (status === "draft") {
    return POST_SAVED_AS_DRAFT;
  }
  return POST_CREATED;
};

const page = (query: {
  readonly limit?: number;
  readonly offset?: number;
}) => ({
  limit: Math.min(100, Math.max(1, query.limit ?? 20)),
  offset: Math.max(0, query.offset ?? 0),
});

export const PostsHandlers = HttpApiBuilder.group(
  Api,
  "posts",
  Effect.fnUntraced(function* (handlers) {
    const posts = yield* PostService;
    const workspaces = yield* WorkspaceAccessService;
    const analytics = yield* ProductAnalytics;
    return handlers
      .handle("list", ({ params, query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:read",
          });
          return yield* posts.list({
            workspaceId: access.workspaceId,
            ...page(query),
            status: query.status,
          });
        })
      )
      .handle("create", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:write",
          });
          const post = yield* posts.create({
            workspaceId: access.workspaceId,
            actor: { memberId: access.memberId, role: access.role },
            value: payload,
          });
          yield* analytics.capture(
            workspaceEvent({
              auth,
              access,
              event: postCreateEvent(post.status),
              properties: {
                post_id: post.id,
                status: post.status,
                source: post.source,
                target_count: post.targets.length,
              },
            })
          );
          return post;
        })
      )
      .handle("bulkCreate", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:write",
          });
          const results = [];
          for (let index = 0; index < payload.length; index++) {
            const value = payload[index];
            if (!value) {
              continue;
            }
            const result = yield* posts
              .create({
                workspaceId: access.workspaceId,
                actor: { memberId: access.memberId, role: access.role },
                value,
              })
              .pipe(Effect.result);
            results.push(
              result._tag === "Success"
                ? { index, ok: true as const, post: result.success }
                : {
                    index,
                    ok: false as const,
                    error: {
                      code: result.failure._tag,
                      message: result.failure.message,
                    },
                  }
            );
          }
          return results;
        })
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:read",
          });
          return yield* posts.get(access.workspaceId, params.id);
        })
      )
      .handle("update", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:write",
          });
          const updated = yield* posts.update({
            workspaceId: access.workspaceId,
            postId: params.id,
            actor: { memberId: access.memberId, role: access.role },
            value: payload,
          });
          yield* analytics.capture(
            workspaceEvent({
              auth,
              access,
              event: POST_UPDATED,
              properties: { post_id: params.id, status: updated.status },
            })
          );
          return updated;
        })
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:write",
          });
          yield* posts.remove(access.workspaceId, params.id);
          return { deleted: true };
        })
      )
      .handle("targets", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:read",
          });
          return (yield* posts.get(access.workspaceId, params.id)).targets;
        })
      )
      .handle("updateTarget", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:write",
          });
          return yield* posts.updateTarget({
            workspaceId: access.workspaceId,
            postId: params.id,
            targetId: params.targetId,
            actor: { memberId: access.memberId, role: access.role },
            ...payload,
          });
        })
      )
      .handle("retryTarget", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:write",
          });
          return yield* posts.retryTarget({
            workspaceId: access.workspaceId,
            postId: params.id,
            targetId: params.targetId,
          });
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));

export const ReviewsHandlers = HttpApiBuilder.group(
  Api,
  "reviews",
  Effect.fnUntraced(function* (handlers) {
    const reviews = yield* ReviewService;
    const workspaces = yield* WorkspaceAccessService;
    const analytics = yield* ProductAnalytics;
    return handlers
      .handle("queue", ({ params, query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "reviews:read",
          });
          const paging = page(query);
          return yield* reviews.queue(
            access.workspaceId,
            paging.limit,
            paging.offset
          );
        })
      )
      .handle("getForPost", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "reviews:read",
          });
          return yield* reviews.getForPost(access.workspaceId, params.postId);
        })
      )
      .handle("activity", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "reviews:read",
          });
          return yield* reviews.activity(access.workspaceId, params.postId);
        })
      )
      .handle("act", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "reviews:write",
          });
          const result = yield* reviews.act({
            workspaceId: access.workspaceId,
            postId: params.postId,
            memberId: access.memberId,
            role: access.role,
            action: payload,
          });
          yield* analytics.capture(
            workspaceEvent({
              auth,
              access,
              event: REVIEW_ACTIONED,
              properties: { action: payload.action, post_id: params.postId },
            })
          );
          return result;
        })
      )
      .handle("bulkAct", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "reviews:write",
          });
          const results = [];
          for (const postId of payload.postIds) {
            const result = yield* reviews
              .act({
                workspaceId: access.workspaceId,
                postId,
                memberId: access.memberId,
                role: access.role,
                action: payload.action,
              })
              .pipe(Effect.result);
            results.push({ postId, ok: result._tag === "Success" });
          }
          yield* analytics.capture(
            workspaceEvent({
              auth,
              access,
              event: REVIEW_ACTIONED,
              properties: {
                action: payload.action.action,
                bulk: true,
                count: payload.postIds.length,
              },
            })
          );
          return results;
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));

export const MediaHandlers = HttpApiBuilder.group(
  Api,
  "media",
  Effect.fnUntraced(function* (handlers) {
    const media = yield* MediaService;
    const workspaces = yield* WorkspaceAccessService;
    return handlers
      .handle("list", ({ params, query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:read",
          });
          const paging = page(query);
          return yield* media.list(
            access.workspaceId,
            paging.limit,
            paging.offset
          );
        })
      )
      .handle("get", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "posts:read",
          });
          return yield* media.get(access.workspaceId, params.id);
        })
      )
      .handle("uploads", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "media:write",
          });
          return yield* media.createUploads({
            workspaceId: access.workspaceId,
            billingOwnerUserId: access.billingOwnerUserId,
            files: payload,
          });
        })
      )
      .handle("complete", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "media:write",
          });
          return yield* media.complete({
            workspaceId: access.workspaceId,
            billingOwnerUserId: access.billingOwnerUserId,
            mediaIds: payload.map((item) => item.mediaId),
          });
        })
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "media:write",
          });
          yield* media.remove(access.workspaceId, params.id);
          return { deleted: true };
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));

export const ConnectionsHandlers = HttpApiBuilder.group(
  Api,
  "connections",
  Effect.fnUntraced(function* (handlers) {
    const connections = yield* ConnectionsService;
    const workspaces = yield* WorkspaceAccessService;
    return handlers
      .handle("list", ({ params, query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "accounts:read",
          });
          const paging = page(query);
          return yield* connections.list(
            access.workspaceId,
            paging.limit,
            paging.offset
          );
        })
      )
      .handle("remove", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "accounts:write",
          });
          yield* connections.remove(access.workspaceId, params.id);
          return { deleted: true };
        })
      )
      .handle("mint", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "accounts:write",
          });
          return yield* connections.mint(
            access.workspaceId,
            params.platform,
            auth,
            payload.includeInsights
          );
        })
      )
      .handle("confirmTransfer", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const destination = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "accounts:write",
          });
          const source = yield* workspaces.require({
            workspaceId: payload.sourceWorkspaceId,
            auth,
            scope: "accounts:write",
          });
          yield* connections.confirmTransfer({
            connectionId: params.id,
            sourceWorkspaceId: source.workspaceId,
            destinationWorkspaceId: destination.workspaceId,
          });
          return { confirmed: true };
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));

export const AdminHandlers = HttpApiBuilder.group(
  Api,
  "admin",
  Effect.fnUntraced(function* (handlers) {
    const admin = yield* AdminService;
    const workspaces = yield* WorkspaceAccessService;
    const analytics = yield* ProductAnalytics;
    return handlers
      .handle("workspace", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "members:read",
          });
          return yield* admin.getWorkspace(access.workspaceId);
        })
      )
      .handle("updateWorkspace", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "members:write",
          });
          return yield* admin.updateWorkspace(access.workspaceId, payload);
        })
      )
      .handle("deleteWorkspace", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "members:write",
          });
          yield* admin.deleteWorkspace(access.workspaceId);
          return { deleted: true };
        })
      )
      .handle("members", ({ params, query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "members:read",
          });
          const paging = page(query);
          return yield* admin.listMembers(
            access.workspaceId,
            paging.limit,
            paging.offset
          );
        })
      )
      .handle("inviteMember", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "members:write",
          });
          const invited = yield* admin.inviteMember({
            workspaceId: access.workspaceId,
            clerkOrgId: access.clerkOrgId,
            email: payload.email,
            role: payload.role,
            actorRole: access.role,
          });
          yield* analytics.capture(
            workspaceEvent({
              auth,
              access,
              event: MEMBER_INVITED,
              // Role only — never the invitee's email (PII).
              properties: { role: payload.role },
            })
          );
          return invited;
        })
      )
      .handle("updateMember", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "members:write",
          });
          return yield* admin.updateMember({
            workspaceId: access.workspaceId,
            memberId: params.id,
            role: payload.role,
            actorRole: access.role,
          });
        })
      )
      .handle("removeMember", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "members:write",
          });
          yield* admin.removeMember({
            workspaceId: access.workspaceId,
            memberId: params.id,
            actorRole: access.role,
          });
          return { deleted: true };
        })
      )
      .handle("apiKeys", ({ params, query }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "apikeys:write",
          });
          const paging = page(query);
          return yield* admin.listApiKeys(
            access.workspaceId,
            paging.limit,
            paging.offset
          );
        })
      )
      .handle("createApiKey", ({ params, payload }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "apikeys:write",
          });
          const created = yield* admin.createApiKey({
            workspaceId: access.workspaceId,
            memberId: access.memberId,
            actorRole: access.role,
            ...payload,
          });
          yield* analytics.capture(
            workspaceEvent({ auth, access, event: API_KEY_CREATED })
          );
          return created;
        })
      )
      .handle("revokeApiKey", ({ params }) =>
        Effect.gen(function* () {
          const auth = yield* CurrentAuth;
          const access = yield* workspaces.require({
            workspaceId: params.workspaceId,
            auth,
            scope: "apikeys:write",
          });
          yield* admin.revokeApiKey(access.workspaceId, params.id);
          return { revoked: true };
        })
      );
  })
).pipe(Layer.provide(AuthenticationLive));
