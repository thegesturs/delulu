/**
 * Synthetic Convex snapshot covering every transform edge case called out in
 * the M5 plan: distinct/identical alternativeContent, missing platformPosts,
 * PROCESSING, dual-ownership permutations, empty content, tiktokSettings
 * fallback, contact-without-automation, multi-subscription users, dangling
 * pendingPostIds, cross-workspace + unresolved embedded media.
 *
 * Convex `_id` values use readable slugs; the transform maps them to Nano IDs.
 */
import type { FixtureTables } from "./builder";

export const T = 1_700_000_000_000; // 2023-11-14, epoch ms
export const FUTURE = 2_000_000_000_000; // 2033, epoch ms — future scheduled/expiry
export const SMALL_EXPIRES = 3_600_000; // < 10^12 → treated as unusable expiry (null + report)

const doc = (
  id: string,
  creation: number,
  fields: Record<string, unknown>
) => ({
  _id: id,
  _creationTime: creation,
  ...fields,
});

export const legacyTables: FixtureTables = {
  users: [
    doc("user_alice", T, {
      email: "alice@example.com",
      name: "Alice",
      externalId: "clerk_alice",
      // Usage counters set to the values reconciliation recomputes from the
      // migrated rows, so verify check 6 is a clean no-op on this fixture.
      usage: {
        socialAccounts: 2,
        monthlyPosts: 6,
        monthlyPostsPeriodStart: T,
        mediaStorageBytes: 1000,
        dmsSent: 3,
        transcriptionsUsed: 1,
        transcriptionPeriodStart: T,
      },
      dodoCustomerId: "cus_alice",
      subscriptionId: "sub_alice_plan",
      addonSubscriptionIds: ["sub_alice_addon"],
      updatedAt: T,
    }),
    doc("user_bob", T, {
      email: "bob@example.com",
      name: "Bob",
      externalId: "clerk_bob",
      usage: { socialAccounts: 0, monthlyPosts: 0, monthlyPostsPeriodStart: T },
      updatedAt: T,
    }),
    doc("user_carol", T, {
      email: "carol@example.com",
      name: "Carol",
      externalId: "clerk_carol",
      // Carol owns the Acme org workspace: 2 org posts, 1 connection, and >2^31
      // bytes of media (regression for int4 overflow in the verify read-casts).
      usage: {
        socialAccounts: 1,
        monthlyPosts: 2,
        mediaStorageBytes: 3_000_000_000,
      },
      updatedAt: T,
    }),
    doc("user_dave", T, {
      email: "dave@example.com",
      name: "Dave",
      externalId: "clerk_dave",
      usage: { socialAccounts: 0 },
      updatedAt: T,
    }),
    doc("user_erin", T, {
      email: "erin@example.com",
      name: "Erin",
      externalId: "clerk_erin",
      usage: { socialAccounts: 0 },
      updatedAt: T,
    }),
  ],

  organizations: [
    doc("org_acme", T, {
      clerkOrgId: "clerk_org_acme",
      name: "Acme",
      slug: "acme",
      createdBy: "clerk_carol",
      createdAt: T,
      updatedAt: T,
    }),
  ],

  organizationMembers: [
    doc("om_carol", T, {
      organizationId: "org_acme",
      clerkOrgId: "clerk_org_acme",
      userId: "user_carol",
      clerkUserId: "clerk_carol",
      role: "org:admin",
      joinedAt: T,
      updatedAt: T,
    }),
    doc("om_dave", T + 1, {
      organizationId: "org_acme",
      clerkOrgId: "clerk_org_acme",
      userId: "user_dave",
      clerkUserId: "clerk_dave",
      role: "org:admin",
      joinedAt: T + 1,
      updatedAt: T,
    }),
    doc("om_erin", T + 2, {
      organizationId: "org_acme",
      clerkOrgId: "clerk_org_acme",
      userId: "user_erin",
      clerkUserId: "clerk_erin",
      role: "org:member",
      joinedAt: T + 2,
      updatedAt: T,
    }),
  ],

  socialProviders: [
    doc("sp_alice_ig", T, {
      userId: "user_alice",
      accessToken: "cipher_alice_ig",
      refreshToken: "cipher_alice_ig_refresh",
      expiresIn: FUTURE,
      refreshTokenExpiresIn: FUTURE,
      profileId: "ig_alice",
      username: "alice_ig",
      fullName: "Alice on Instagram",
      profileImage: "https://cdn.example.com/alice.jpg",
      socialType: "INSTAGRAM",
      isActive: true,
      lastSyncedAt: T,
      updatedAt: T,
    }),
    doc("sp_alice_tt", T, {
      userId: "user_alice",
      accessToken: "cipher_alice_tt",
      expiresIn: SMALL_EXPIRES,
      profileId: "tt_alice",
      username: "alice_tt",
      fullName: "Alice on TikTok",
      socialType: "TIKTOK",
      isActive: true,
      updatedAt: T,
    }),
    doc("sp_acme_tw", T, {
      organizationId: "clerk_org_acme",
      accessToken: "cipher_acme_tw",
      expiresIn: FUTURE,
      profileId: "tw_acme",
      username: "acme_tw",
      fullName: "Acme on Twitter",
      socialType: "TWITTER",
      isActive: true,
      updatedAt: T,
    }),
  ],

  media: [
    doc("media_a", T, {
      userId: "user_alice",
      bucketKey: "media/a.jpg",
      url: "https://cdn.example.com/a.jpg",
      mediaType: "IMAGE",
      size: 1000,
      altText: "Photo A",
      createdAt: T,
      updatedAt: T,
    }),
    doc("media_acme", T, {
      userId: "user_carol",
      organizationId: "clerk_org_acme",
      bucketKey: "media/acme.mp4",
      url: "https://cdn.example.com/acme.mp4",
      mediaType: "VIDEO",
      size: 3_000_000_000, // > 2^31 — exercises bigint read-casts in verify

      createdAt: T,
      updatedAt: T,
    }),
  ],

  posts: [
    // Draft with title (unpublished → prepend into first segment) + resolvable media.
    doc("post_alice_draft", T, {
      userId: "user_alice",
      status: "SAVED",
      reviewStatus: "PENDING",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      content: [
        {
          order: 0,
          name: "default",
          title: "My Title",
          text: "hello world",
          media: [
            {
              mediaType: "IMAGE",
              bucketKey: "media/a.jpg",
              url: "https://cdn.example.com/a.jpg",
              altText: "Photo A",
            },
          ],
        },
      ],
      socialProviderIds: ["sp_alice_ig"],
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
    // Scheduled → pending target + scheduled_at + jobs row.
    doc("post_alice_scheduled", T, {
      userId: "user_alice",
      status: "SCHEDULED",
      reviewStatus: "PENDING",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      scheduledAt: FUTURE,
      content: [
        { order: 0, name: "default", text: "scheduled body", media: [] },
      ],
      socialProviderIds: ["sp_alice_ig"],
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
    // Org post, published, platformPosts present → target published; title dropped.
    doc("post_acme_published", T, {
      organizationId: "clerk_org_acme",
      status: "PUBLISHED",
      reviewStatus: "APPROVED",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      content: [
        {
          order: 0,
          name: "default",
          title: "Drop me",
          text: "published body",
          media: [
            {
              mediaType: "VIDEO",
              bucketKey: "media/acme.mp4",
              url: "https://cdn.example.com/acme.mp4",
            },
          ],
        },
      ],
      socialProviderIds: ["sp_acme_tw"],
      platformPosts: [
        {
          socialProviderId: "sp_acme_tw",
          platformPostId: "tw123",
          platformPostUrl: "https://twitter.com/acme/tw123",
          postedAt: T,
          createdAt: T,
          updatedAt: T,
        },
      ],
      publishedAt: T,
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
    // PROCESSING → target failed with interruption message; unresolved embedded media → synthesize.
    doc("post_alice_processing", T, {
      userId: "user_alice",
      status: "PROCESSING",
      reviewStatus: "PENDING",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      content: [
        {
          order: 0,
          name: "default",
          text: "stuck publishing",
          media: [
            {
              mediaType: "IMAGE",
              bucketKey: "media/missing.jpg",
              url: "https://cdn.example.com/missing.jpg",
            },
          ],
        },
      ],
      socialProviderIds: ["sp_alice_ig"],
      retryCount: 1,
      createdAt: T,
      updatedAt: T,
    }),
    // Distinct alternativeContent → extra group; tiktokSettings fallback for TikTok target.
    doc("post_alice_alt_distinct", T, {
      userId: "user_alice",
      status: "SAVED",
      reviewStatus: "PENDING",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      content: [{ order: 0, name: "default", text: "default text", media: [] }],
      alternativeContent: [
        {
          socialProviderId: "sp_alice_ig",
          content: [
            { order: 0, name: "default", text: "IG-specific text", media: [] },
          ],
        },
      ],
      tiktokSettings: {
        privacy: "SELF_ONLY",
        allowComments: true,
        allowDuet: false,
        allowStitch: true,
        promotionContent: "NONE",
      },
      socialProviderIds: ["sp_alice_ig", "sp_alice_tt"],
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
    // Identical alternativeContent → collapses into the default group.
    doc("post_alice_alt_identical", T, {
      userId: "user_alice",
      status: "SAVED",
      reviewStatus: "PENDING",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      content: [{ order: 0, name: "default", text: "same text", media: [] }],
      alternativeContent: [
        {
          socialProviderId: "sp_alice_ig",
          content: [
            { order: 0, name: "default", text: "same text", media: [] },
          ],
        },
      ],
      socialProviderIds: ["sp_alice_ig"],
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
    // Empty content → one empty segment.
    doc("post_alice_empty", T, {
      userId: "user_alice",
      status: "SAVED",
      reviewStatus: "PENDING",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      content: [],
      socialProviderIds: ["sp_alice_ig"],
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
    // Deleted → deleted_at.
    doc("post_alice_deleted", T, {
      userId: "user_alice",
      status: "DELETED",
      reviewStatus: "PENDING",
      isDeleted: true,
      privacyStatus: "PUBLIC",
      content: [{ order: 0, name: "default", text: "gone", media: [] }],
      socialProviderIds: ["sp_alice_ig"],
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
    // Org post in review (PENDING) → pending_review via migrated review row; cross-workspace media synth.
    doc("post_acme_review_pending", T, {
      organizationId: "clerk_org_acme",
      status: "SAVED",
      reviewStatus: "PENDING",
      isDeleted: false,
      privacyStatus: "PUBLIC",
      content: [
        {
          order: 0,
          name: "default",
          text: "needs review",
          media: [
            {
              mediaType: "IMAGE",
              bucketKey: "media/a.jpg",
              url: "https://cdn.example.com/a.jpg",
            },
          ],
        },
      ],
      socialProviderIds: ["sp_acme_tw"],
      retryCount: 0,
      createdAt: T,
      updatedAt: T,
    }),
  ],

  postReviews: [
    doc("pr_acme", T, {
      postId: "post_acme_published",
      organizationId: "clerk_org_acme",
      status: "APPROVED",
      reviewedBy: "user_dave",
      reviewedAt: T,
      submittedBy: "user_carol",
      submittedAt: T,
      updatedAt: T,
    }),
    doc("pr_pending", T, {
      postId: "post_acme_review_pending",
      organizationId: "clerk_org_acme",
      status: "PENDING",
      submittedBy: "user_erin",
      submittedAt: T,
      updatedAt: T,
    }),
  ],

  reviewActivity: [
    doc("ra_approved", T, {
      postId: "post_acme_published",
      reviewId: "pr_acme",
      organizationId: "clerk_org_acme",
      type: "APPROVED",
      userId: "user_dave",
      comment: "Looks good",
      createdAt: T,
    }),
    doc("ra_submitted", T, {
      postId: "post_acme_review_pending",
      reviewId: "pr_pending",
      organizationId: "clerk_org_acme",
      type: "SUBMITTED",
      userId: "user_erin",
      createdAt: T,
    }),
  ],

  subscriptions: [
    doc("sub_alice_plan", T, {
      userId: "user_alice",
      dodoCustomerId: "cus_alice",
      dodoSubscriptionId: "dsub_alice",
      planType: "VIBE",
      status: "ACTIVE",
      type: "plan",
      billingPeriod: "MONTHLY",
      currentPeriodStart: T,
      currentPeriodEnd: FUTURE,
      metadata: { productId: "prod_vibe" },
      updatedAt: T,
    }),
    doc("sub_alice_addon", T, {
      userId: "user_alice",
      dodoCustomerId: "cus_alice",
      dodoSubscriptionId: "dsub_alice_addon",
      planType: "FREE",
      status: "ACTIVE",
      type: "addon",
      addonType: "sorted",
      updatedAt: T,
    }),
    doc("sub_carol_active", T, {
      userId: "user_carol",
      dodoCustomerId: "cus_carol",
      dodoSubscriptionId: "dsub_carol",
      planType: "ECHO",
      status: "ACTIVE",
      type: "plan",
      billingPeriod: "YEARLY",
      currentPeriodStart: T,
      currentPeriodEnd: FUTURE,
      updatedAt: T,
    }),
  ],

  transactions: [
    doc("txn_alice", T, {
      userId: "user_alice",
      subscriptionId: "sub_alice_plan",
      dodoPaymentId: "pay_alice_1",
      dodoCustomerId: "cus_alice",
      amount: 1500,
      currency: "USD",
      status: "SUCCEEDED",
      description: "Vibe monthly",
      receiptUrl: "https://dodo.example.com/receipt/1",
      paidAt: T,
      updatedAt: T,
    }),
  ],

  automations: [
    doc("auto_alice_ig", T, {
      userId: "user_alice",
      socialProviderId: "sp_alice_ig",
      name: "Welcome DM",
      isActive: true,
      triggers: [
        {
          id: "t1",
          type: "trigger",
          triggerType: "COMMENT",
          targetPostIds: ["ig_media_1", "ig_media_2"],
          pendingPostIds: ["post_alice_scheduled", "post_does_not_exist"],
          keywordFilter: { operator: "contains", value: "info" },
        },
      ],
      steps: [{ id: "s1", type: "send_dm", messageTemplate: "Hi there!" }],
      totalTriggered: 5,
      totalDMsSent: 4,
      totalFailed: 1,
      createdAt: T,
      updatedAt: T,
    }),
  ],

  automationLogs: [
    doc("log_alice_1", T, {
      automationId: "auto_alice_ig",
      userId: "user_alice",
      instagramCommentId: "c1",
      instagramUsername: "fan1",
      status: "DM_SENT",
      createdAt: T,
    }),
  ],

  automationContacts: [
    doc("contact_alice_1", T, {
      userId: "user_alice",
      socialProviderId: "sp_alice_ig",
      instagramUserId: "iguser1",
      instagramUsername: "fan1",
      email: "fan1@example.com",
      createdAt: T,
      updatedAt: T,
    }),
    // Contact on a connection with NO automation → synthesize placeholder automation.
    doc("contact_orphan", T, {
      userId: "user_alice",
      socialProviderId: "sp_alice_tt",
      instagramUserId: "ttuser1",
      instagramUsername: "ttfan",
      email: "ttfan@example.com",
      createdAt: T,
      updatedAt: T,
    }),
  ],

  transcriptions: [
    doc("trans_alice", T, {
      userId: "user_alice",
      reelId: "reel1",
      reelUrl: "https://instagram.com/reel/1",
      text: "This is the transcript text",
      altText: "alt",
      language: "en",
      durationSeconds: 30,
      createdAt: T,
    }),
  ],

  // Dropped tables — present in snapshot, must not be migrated.
  apiKeys: [
    doc("apikey_alice", T, {
      userId: "user_alice",
      name: "old key",
      keyHash: "hash",
      keyPrefix: "dl_",
      createdAt: T,
    }),
  ],
  automationSessions: [
    doc("sess_1", T, {
      automationId: "auto_alice_ig",
      userId: "user_alice",
      instagramUserId: "iguser1",
      currentStepId: "s1",
      status: "active",
      lastActivityAt: T,
      createdAt: T,
    }),
  ],
};

/** Golden fixture as a Convex-export ZIP. */
export const goldenTables = legacyTables;
