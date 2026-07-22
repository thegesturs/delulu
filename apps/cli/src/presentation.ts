import { type CliResult, truncateText } from "./output.js";
import { canonicalAccountSelector } from "./post-flow.js";

interface PostLike {
  readonly id: string;
  readonly status: string;
  readonly groups: readonly {
    readonly segments: readonly { readonly text: string }[];
  }[];
  readonly targets: readonly {
    readonly id: string;
    readonly status: string;
    readonly connectionId?: string;
    readonly scheduledAt?: string | null;
    readonly postedAt?: string | null;
    readonly platformPostUrl?: string | null;
    readonly error?: string | null;
  }[];
  readonly updatedAt?: string;
  readonly createdAt?: string;
  readonly source?: string;
  readonly [key: string]: unknown;
}

interface PageLike<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly limit?: number;
  readonly offset?: number;
}

interface AccountLike {
  readonly id: string;
  readonly platform: string;
  readonly username?: string | null;
  readonly displayName?: string | null;
  readonly expiresAt?: string | null;
  readonly profileId?: string;
  readonly [key: string]: unknown;
}

interface WorkspaceLike {
  readonly workspaceId: string;
  readonly name: string;
  readonly slug?: string | null;
  readonly role: string;
}

interface OverviewLike {
  readonly workspace: { readonly name: string; readonly role: string };
  readonly setup: {
    readonly outstandingAction?: string | null;
    readonly onboardingComplete: boolean;
    readonly connectedPlatforms?: readonly string[];
    readonly subscription?: { readonly plan?: string };
  };
  readonly accounts?: {
    readonly total?: number;
    readonly expiringSoon?: number;
  };
  readonly subscription?: { readonly plan?: string };
  readonly publishing?: Readonly<Record<string, number>>;
  readonly reviews?: { readonly pending?: number };
}

interface ReviewLike {
  readonly id: string;
  readonly postId: string;
  readonly status: string;
  readonly submittedByMemberId: string;
}

const postCaption = (post: PostLike) =>
  String(post.groups?.[0]?.segments?.[0]?.text ?? "");

const postWhen = (post: PostLike) =>
  post.targets.find((target) => target.scheduledAt)?.scheduledAt ??
  post.targets.find((target) => target.postedAt)?.postedAt ??
  post.updatedAt ??
  null;

export const presentPosts = (
  page: PageLike<PostLike>,
  options: { readonly full?: boolean; readonly workspaceId: string }
): CliResult => {
  const data = page.data.map((post) =>
    options.full
      ? {
          id: post.id,
          state: post.status,
          caption: postCaption(post),
          source: post.source,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          targets: post.targets.map((target) => ({
            id: target.id,
            connection: target.connectionId,
            state: target.status,
            when: target.scheduledAt ?? target.postedAt ?? null,
            url: target.platformPostUrl,
            error: target.error,
          })),
        }
      : {
          id: post.id,
          state: post.status,
          when: postWhen(post),
          caption: truncateText(postCaption(post), 160),
        }
  );
  return {
    status: "ok",
    message: data.length === 0 ? "0 posts" : `${data.length} posts`,
    summary: {
      returned: data.length,
      total: page.total ?? data.length,
      nextOffset:
        (page.offset ?? 0) + data.length < (page.total ?? data.length)
          ? (page.offset ?? 0) + data.length
          : null,
    },
    data,
    next:
      data.length === 0
        ? ['delulu post "Your caption" --to <account> --draft']
        : [
            "delulu show <post-id>",
            'delulu post "Your caption" --to <account> --draft',
          ],
  };
};

export const presentPost = (
  post: PostLike,
  options: { readonly full?: boolean }
): CliResult => ({
  status: "ok",
  message: `Post ${post.status}`,
  summary: {
    id: post.id,
    state: post.status,
    targets: post.targets?.length ?? 0,
    caption: truncateText(postCaption(post), 160, options.full),
  },
  data: options.full
    ? {
        source: post.source,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        groups: post.groups,
        targets: post.targets.map((target) => ({
          id: target.id,
          connection: target.connectionId,
          state: target.status,
          scheduledAt: target.scheduledAt,
          postedAt: target.postedAt,
          url: target.platformPostUrl,
          error: target.error,
        })),
      }
    : post.targets.map((target) => ({
        id: target.id,
        state: target.status,
        url: target.platformPostUrl,
        error: target.error ? truncateText(String(target.error), 240) : null,
      })),
  next:
    post.status === "draft"
      ? [
          `delulu publish ${post.id} --now`,
          `delulu edit ${post.id} "New caption"`,
        ]
      : post.status === "failed" || post.status === "partially_failed"
        ? [`delulu retry ${post.id}`]
        : [`delulu show ${post.id} --full`],
});

export const presentAccounts = (
  page: PageLike<AccountLike>,
  full = false
): CliResult => {
  const data = page.data.map((account) =>
    full
      ? {
          selector: canonicalAccountSelector(account),
          id: account.id,
          platform: account.platform,
          profile: account.profileId,
          username: account.username,
          name: account.displayName,
          expires: account.expiresAt,
        }
      : {
          selector: canonicalAccountSelector(account),
          platform: account.platform,
          name: account.displayName ?? account.username ?? account.id,
          expires: account.expiresAt,
        }
  );
  return {
    status: "ok",
    message:
      data.length === 0
        ? "0 connected accounts"
        : `${data.length} connected accounts`,
    summary: { returned: data.length, total: page.total ?? data.length },
    data,
    next:
      data.length === 0
        ? ["delulu connect <platform>"]
        : [
            'delulu post "Your caption" --to <account> --draft',
            "delulu connect <platform>",
          ],
  };
};

export const presentWorkspaces = (
  page: PageLike<WorkspaceLike>,
  currentId?: string
): CliResult => {
  const data = page.data.map((workspace) => ({
    selector: workspace.slug ?? workspace.workspaceId,
    name: workspace.name,
    role: workspace.role,
    current: workspace.workspaceId === currentId,
  }));
  return {
    status: "ok",
    message: data.length === 0 ? "0 workspaces" : `${data.length} workspaces`,
    summary: { total: data.length, current: currentId ?? null },
    data,
    next: data.length > 1 ? ["delulu workspace use <selector>"] : ["delulu"],
  };
};

export const presentOverview = (
  overview: OverviewLike,
  instance?: {
    deploymentMode: "hosted" | "self_hosted";
    billingEnabled: boolean;
    registrationEnabled: boolean;
    version: string;
  }
): CliResult => {
  const counts = overview.publishing ?? {};
  const setup = overview.setup ?? {};
  const nextAction =
    setup.outstandingAction === "connect_account"
      ? "delulu connect <platform>"
      : setup.outstandingAction === "complete_payment"
        ? "delulu subscribe --plan VIBE --interval MONTHLY"
        : (overview.accounts?.expiringSoon ?? 0) > 0
          ? "delulu accounts"
          : (counts.failed ?? 0) + (counts.partiallyFailed ?? 0) > 0
            ? "delulu posts --status failed"
            : (overview.reviews?.pending ?? 0) > 0
              ? "delulu reviews"
              : (counts.publishing ?? 0) > 0
                ? "delulu posts --status publishing"
                : (counts.scheduledNextSevenDays ?? 0) > 0
                  ? "delulu posts --status scheduled"
                  : (counts.totalPosts ?? 0) === 0
                    ? 'delulu post "Your first post" --to <account> --draft'
                    : "delulu posts";
  return {
    status: "ok",
    message: setup.onboardingComplete
      ? `${overview.workspace.name} is ready`
      : `${overview.workspace.name} needs setup`,
    summary: {
      workspace: overview.workspace.name,
      role: overview.workspace.role,
      onboarding: setup.onboardingComplete ? "complete" : "incomplete",
      plan: overview.subscription?.plan ?? setup.subscription?.plan,
    },
    data: {
      accounts:
        overview.accounts?.total ?? setup.connectedPlatforms?.length ?? 0,
      drafts: counts.drafts ?? 0,
      scheduled: counts.scheduled ?? 0,
      publishing: counts.publishing ?? 0,
      failed: (counts.failed ?? 0) + (counts.partiallyFailed ?? 0),
      pendingReviews: overview.reviews?.pending ?? 0,
      ...(instance ? { instance } : {}),
    },
    next: [nextAction],
  };
};

export const presentReviews = (page: PageLike<ReviewLike>): CliResult => {
  const data = page.data.map((review) => ({
    post: review.postId,
    state: review.status,
    submittedBy: review.submittedByMemberId,
    id: review.id,
  }));
  return {
    status: "ok",
    message: data.length === 0 ? "0 pending reviews" : `${data.length} reviews`,
    summary: { returned: data.length, total: page.total ?? data.length },
    data,
    next: data.length
      ? ["delulu review <post-id> --approve"]
      : ["delulu posts"],
  };
};
