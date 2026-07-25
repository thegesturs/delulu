import { Effect, Schema } from "effect";
import { apiError } from "../../errors";
import { fetchJson } from "../../services/http";
import type { PlatformMediaPage, PlatformQueries } from "../../types";
import { GRAPH_VERSION, PROVIDER } from "./constants";

const MediaListResponse = Schema.Struct({
  data: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      caption: Schema.optional(Schema.String),
      media_type: Schema.String,
      timestamp: Schema.String,
      permalink: Schema.optional(Schema.String),
      thumbnail_url: Schema.optional(Schema.String),
      media_url: Schema.optional(Schema.String),
    })
  ),
  paging: Schema.optional(
    Schema.Struct({
      cursors: Schema.optional(
        Schema.Struct({ after: Schema.optional(Schema.String) })
      ),
    })
  ),
});

const getMedia = (kind: "media" | "stories") =>
  Effect.fn(`InstagramQueries.${kind}`)(function* (input: {
    profileId: string;
    accessToken: string;
    limit?: number;
    after?: string;
  }) {
    const url = new URL(
      `https://graph.instagram.com/${GRAPH_VERSION}/${input.profileId}/${kind}`
    );
    url.searchParams.set(
      "fields",
      "id,caption,media_type,timestamp,permalink,thumbnail_url,media_url"
    );
    url.searchParams.set("limit", String(input.limit ?? 25));
    url.searchParams.set("access_token", input.accessToken);
    if (input.after) {
      url.searchParams.set("after", input.after);
    }
    const raw = yield* fetchJson<unknown>(PROVIDER, url.toString());
    const response = yield* Schema.decodeUnknownEffect(MediaListResponse)(
      raw
    ).pipe(
      Effect.mapError(() =>
        apiError(PROVIDER, 502, "Malformed media-list response")
      )
    );
    return {
      data: response.data
        .map((item) => ({
          id: item.id,
          caption: item.caption ?? null,
          mediaType: item.media_type,
          timestamp: item.timestamp,
          permalink: item.permalink ?? null,
          thumbnailUrl: item.thumbnail_url ?? null,
          mediaUrl: item.media_url ?? null,
        }))
        .sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
      nextCursor: response.paging?.cursors?.after ?? null,
    } satisfies PlatformMediaPage;
  });

/**
 * Post/story pickers used by the automations UI. Ported from
 * `social-provider.ts` getInstagramPosts / getInstagramStories.
 */
export const instagramQueries: PlatformQueries = {
  getPosts: getMedia("media"),
  getStories: getMedia("stories"),
};
