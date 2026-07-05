import { Effect } from "effect";
import type { ConnectionError } from "../../errors";
import { apiError, publishRejected, rateLimited } from "../../errors";
import { fetchJson } from "../../services/http";
import type { PlatformQueries } from "../../types";
import { CREATOR_INFO_URL, PROVIDER } from "./constants";

export interface TikTokCreatorInfo {
  creator_username: string;
  creator_nickname?: string;
  creator_avatar_url?: string;
  privacy_level_options: string[];
  comment_disabled?: boolean;
  duet_disabled?: boolean;
  stitch_disabled?: boolean;
  max_video_post_duration_sec: number;
}

interface TikTokCreatorInfoResponse {
  error?: { code: string; message?: string };
  data?: {
    creator_username?: string;
    creator_nickname?: string;
    creator_avatar_url?: string;
    privacy_level_options?: string[];
    comment_disabled?: boolean;
    duet_disabled?: boolean;
    stitch_disabled?: boolean;
    max_video_post_duration_sec?: number;
  };
}

/**
 * TikTok read queries. `getCreatorInfo` ports the `creator_info/query` POST from
 * `social-provider.ts` — used by the composer to fetch the privacy-level options
 * and interaction toggles the creator's account allows before posting.
 *
 * The proactive token refresh that wrapped the tRPC procedure lives in
 * `auth.refreshToken` now; callers refresh (if needed) before invoking this.
 */
export const tiktokQueries: PlatformQueries = {
  getCreatorInfo: ({
    accessToken,
  }): Effect.Effect<TikTokCreatorInfo, ConnectionError> =>
    Effect.gen(function* () {
      const data = yield* fetchJson<TikTokCreatorInfoResponse>(
        PROVIDER,
        CREATOR_INFO_URL,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
        }
      );

      // TikTok surfaces actionable failures via a body `error.code` even on 200.
      if (data.error?.code && data.error.code !== "ok") {
        const code = data.error.code;
        if (code === "spam_risk_too_many_posts") {
          return yield* Effect.fail(
            rateLimited(
              PROVIDER,
              "Daily post limit reached. Please try again tomorrow."
            )
          );
        }
        if (code === "spam_risk_user_banned_from_posting") {
          return yield* Effect.fail(
            publishRejected(
              PROVIDER,
              "Your TikTok account is banned from posting."
            )
          );
        }
        if (code === "reached_active_user_cap") {
          return yield* Effect.fail(
            rateLimited(
              PROVIDER,
              "Daily quota limit reached. Please try again later."
            )
          );
        }
        return yield* Effect.fail(
          apiError(PROVIDER, 500, data.error.message || "Failed to get creator info")
        );
      }

      if (!data.data?.creator_username) {
        return yield* Effect.fail(
          apiError(PROVIDER, 500, "Failed to get creator info from TikTok response")
        );
      }

      return {
        creator_username: data.data.creator_username,
        creator_nickname: data.data.creator_nickname,
        creator_avatar_url: data.data.creator_avatar_url,
        privacy_level_options: data.data.privacy_level_options ?? [],
        comment_disabled: data.data.comment_disabled,
        duet_disabled: data.data.duet_disabled,
        stitch_disabled: data.data.stitch_disabled,
        max_video_post_duration_sec:
          data.data.max_video_post_duration_sec ?? 60,
      } satisfies TikTokCreatorInfo;
    }),
};
