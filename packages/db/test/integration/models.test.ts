import {
  ApiKey,
  ApiKeyId,
  Automation,
  AutomationContact,
  AutomationContactId,
  AutomationId,
  AutomationRun,
  AutomationRunId,
  Connection,
  ConnectionId,
  Media,
  MediaId,
  MemberId,
  makeApiKeyRepository,
  makeAutomationContactRepository,
  makeAutomationRepository,
  makeAutomationRunRepository,
  makeConnectionRepository,
  makeId,
  makeMediaRepository,
  makePostRepository,
  makePostReviewRepository,
  makePostTargetRepository,
  makeReviewActivityRepository,
  makeSubscriptionRepository,
  makeTransactionRepository,
  makeTranscriptionRepository,
  makeUserRepository,
  makeWorkspaceMemberRepository,
  makeWorkspaceRepository,
  Post,
  PostGroupId,
  PostId,
  PostReview,
  PostReviewId,
  PostTarget,
  PostTargetId,
  ReviewActivity,
  ReviewActivityId,
  Subscription,
  SubscriptionId,
  Transaction,
  TransactionId,
  Transcription,
  TranscriptionId,
  User,
  UserId,
  Workspace,
  WorkspaceId,
  WorkspaceMember,
} from "@delulu/core";
import { PgClient } from "@effect/sql-pg";
import { DateTime, Effect, String as EffectString, Redacted } from "effect";
import { describe, expect, it } from "vitest";

const DatabaseLive = PgClient.layer({
  url: Redacted.make(
    process.env.DATABASE_URL ?? "postgres://delulu:delulu@localhost:5432/delulu"
  ),
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  transformJson: true,
});

const nullable = null;
const json = {};

describe("Postgres Model.Class round trips", () => {
  it("inserts, selects, and decodes every persisted domain model", async () => {
    const program = Effect.gen(function* () {
      const userRepo = yield* makeUserRepository();
      const user = yield* userRepo.insert(
        User.insert.make({
          id: makeId(UserId),
          legacyConvexId: nullable,
          externalId: `clerk_${crypto.randomUUID()}`,
          email: "owner@example.com",
          name: "Owner",
          imageUrl: nullable,
          monthlyPosts: 3n,
          monthlyPostsPeriodStart: nullable,
          dmsSent: 4n,
          dmsSentPeriodStart: nullable,
          transcriptionsUsed: 5n,
          transcriptionsPeriodStart: nullable,
        })
      );
      const workspaceRepo = yield* makeWorkspaceRepository();
      const workspace = yield* workspaceRepo.insert(
        Workspace.insert.make({
          id: makeId(WorkspaceId),
          legacyConvexId: nullable,
          name: "Workspace",
          slug: `ws-${crypto.randomUUID()}`,
          billingOwnerUserId: user.id,
          parentOrgId: nullable,
          clerkOrgId: nullable,
          isPersonal: true,
          deletedAt: nullable,
        })
      );
      const memberRepo = yield* makeWorkspaceMemberRepository();
      const member = yield* memberRepo.insert(
        WorkspaceMember.insert.make({
          id: makeId(MemberId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          userId: user.id,
          role: "owner",
        })
      );
      const connectionRepo = yield* makeConnectionRepository();
      const connection = yield* connectionRepo.insert(
        Connection.insert.make({
          id: makeId(ConnectionId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          platform: "INSTAGRAM",
          profileId: crypto.randomUUID(),
          username: "owner",
          displayName: "Owner",
          accessToken: "opaque",
          refreshToken: nullable,
          cipherVersion: "v1",
          expiresAt: nullable,
          metadata: json,
        })
      );
      const mediaRepo = yield* makeMediaRepository();
      const media = yield* mediaRepo.insert(
        Media.insert.make({
          id: makeId(MediaId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          bucketKey: crypto.randomUUID(),
          url: "https://example.test/media",
          mediaType: "image",
          mimeType: "image/png",
          sizeBytes: 42n,
          width: 100,
          height: 100,
          durationSeconds: nullable,
          thumbnails: [],
          altText: "image",
          status: "ready",
          deletedAt: nullable,
        })
      );
      const groupId = makeId(PostGroupId);
      const postRepo = yield* makePostRepository();
      const post = yield* postRepo.insert(
        Post.insert.make({
          id: makeId(PostId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          status: "draft",
          content: {
            groups: [
              {
                id: groupId,
                isDefault: true,
                segments: [{ text: "hello", media: [{ id: media.id }] }],
              },
            ],
          },
          createdByMemberId: member.id,
          source: "app",
          externalSubmissionId: nullable,
          deletedAt: nullable,
          publishedAt: nullable,
        })
      );
      const targetRepo = yield* makePostTargetRepository();
      const target = yield* targetRepo.insert(
        PostTarget.insert.make({
          id: makeId(PostTargetId),
          legacyConvexId: nullable,
          postId: post.id,
          connectionId: connection.id,
          groupId,
          settings: {
            platform: "INSTAGRAM",
            values: {
              shareToFeed: true,
              shareToStory: false,
              trialReels: false,
              graduationStrategy: "MANUAL",
            },
          },
          scheduledAt: nullable,
          status: "pending",
          platformPostId: nullable,
          platformPostUrl: nullable,
          postedAt: nullable,
          error: nullable,
          attempts: 0,
        })
      );
      const keyRepo = yield* makeApiKeyRepository();
      const key = yield* keyRepo.insert(
        ApiKey.insert.make({
          id: makeId(ApiKeyId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          createdByMemberId: member.id,
          name: "test",
          keyPrefix: `dl_${crypto.randomUUID()}`,
          keyHash: crypto.randomUUID(),
          role: "editor",
          scopes: ["posts:read", "posts:write"],
          lastUsedAt: nullable,
          expiresAt: nullable,
          revokedAt: nullable,
        })
      );
      const subscriptionRepo = yield* makeSubscriptionRepository();
      const subscription = yield* subscriptionRepo.insert(
        Subscription.insert.make({
          id: makeId(SubscriptionId),
          legacyConvexId: nullable,
          billingOwnerUserId: user.id,
          providerCustomerId: nullable,
          providerSubscriptionId: nullable,
          plan: "free",
          status: "active",
          currentPeriodStart: nullable,
          currentPeriodEnd: nullable,
          monthlyPosts: 3n,
          mediaStorageBytes: 42n,
          dmsSent: 4n,
          dmsSkipped: 0n,
          transcriptionsUsed: 5n,
        })
      );
      const transactionRepo = yield* makeTransactionRepository();
      const transaction = yield* transactionRepo.insert(
        Transaction.insert.make({
          id: makeId(TransactionId),
          legacyConvexId: nullable,
          billingOwnerUserId: user.id,
          providerTransactionId: crypto.randomUUID(),
          amountMinor: 999n,
          currency: "USD",
          status: "paid",
          metadata: json,
        })
      );
      const reviewRepo = yield* makePostReviewRepository();
      const review = yield* reviewRepo.insert(
        PostReview.insert.make({
          id: makeId(PostReviewId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          postId: post.id,
          status: "pending",
          contentFingerprint: "hash",
          submittedByMemberId: member.id,
          resolvedByMemberId: nullable,
          resolvedAt: nullable,
        })
      );
      const activityRepo = yield* makeReviewActivityRepository();
      const activity = yield* activityRepo.insert(
        ReviewActivity.insert.make({
          id: makeId(ReviewActivityId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          postId: post.id,
          reviewId: review.id,
          actorMemberId: member.id,
          activityType: "review.submitted",
          comment: nullable,
          metadata: json,
        })
      );
      const automationRepo = yield* makeAutomationRepository();
      const automation = yield* automationRepo.insert(
        Automation.insert.make({
          id: makeId(AutomationId),
          legacyConvexId: nullable,
          externalSubmissionId: nullable,
          workspaceId: workspace.id,
          connectionId: connection.id,
          platform: "test",
          category: "dm",
          triggerConfig: json,
          enabled: true,
        })
      );
      const runRepo = yield* makeAutomationRunRepository();
      const run = yield* runRepo.insert(
        AutomationRun.insert.make({
          id: makeId(AutomationRunId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          automationId: automation.id,
          status: "complete",
          input: json,
          output: json,
          error: nullable,
          startedAt: DateTime.nowUnsafe(),
          completedAt: nullable,
        })
      );
      const contactRepo = yield* makeAutomationContactRepository();
      const contact = yield* contactRepo.insert(
        AutomationContact.insert.make({
          id: makeId(AutomationContactId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          automationId: automation.id,
          platformUserId: crypto.randomUUID(),
          email: "contact@example.com",
          metadata: json,
        })
      );
      const transcriptionRepo = yield* makeTranscriptionRepository();
      const transcription = yield* transcriptionRepo.insert(
        Transcription.insert.make({
          id: makeId(TranscriptionId),
          legacyConvexId: nullable,
          workspaceId: workspace.id,
          mediaId: media.id,
          reelId: null,
          reelUrl: null,
          text: "transcribed text",
          altText: null,
          language: "en",
          durationSeconds: 1,
        })
      );

      return {
        user: yield* userRepo.findById(user.id),
        workspace: yield* workspaceRepo.findById(workspace.id),
        member: yield* memberRepo.findById(member.id),
        connection: yield* connectionRepo.findById(connection.id),
        media: yield* mediaRepo.findById(media.id),
        post: yield* postRepo.findById(post.id),
        target: yield* targetRepo.findById(target.id),
        key: yield* keyRepo.findById(key.id),
        subscription: yield* subscriptionRepo.findById(subscription.id),
        transaction: yield* transactionRepo.findById(transaction.id),
        review: yield* reviewRepo.findById(review.id),
        activity: yield* activityRepo.findById(activity.id),
        automation: yield* automationRepo.findById(automation.id),
        run: yield* runRepo.findById(run.id),
        contact: yield* contactRepo.findById(contact.id),
        transcription: yield* transcriptionRepo.findById(transcription.id),
      };
    });
    const result = await Effect.runPromise(
      program.pipe(Effect.provide(DatabaseLive))
    );
    expect(Object.values(result)).toHaveLength(16);
    expect(result.post.content.groups[0]?.id).toBe(result.target.groupId);
    expect(result.subscription.mediaStorageBytes).toBe(42n);
    expect(result.key.role).toBe("editor");
    expect(result.key.scopes).toEqual(["posts:read", "posts:write"]);
  });
});
