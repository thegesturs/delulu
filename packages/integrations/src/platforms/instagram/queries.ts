import type { PlatformQueries } from "../../types";
import { fetchJson } from "../../services/http";
import { GRAPH_VERSION, PROVIDER } from "./constants";

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  timestamp: string;
  permalink: string;
  thumbnail_url?: string;
  media_url?: string;
}

interface MediaListResponse {
  data: InstagramMedia[];
}

/**
 * Post/story pickers used by the automations UI. Ported from
 * `social-provider.ts` getInstagramPosts / getInstagramStories.
 */
export const instagramQueries: PlatformQueries = {
  getPosts: ({ profileId, accessToken, limit = 25 }) =>
    fetchJson<MediaListResponse>(
      PROVIDER,
      `https://graph.instagram.com/${GRAPH_VERSION}/${profileId}/media?fields=id,caption,media_type,timestamp,permalink,thumbnail_url,media_url&limit=${limit}&access_token=${accessToken}`
    ),

  getStories: ({ profileId, accessToken, limit = 25 }) =>
    fetchJson<MediaListResponse>(
      PROVIDER,
      `https://graph.instagram.com/${GRAPH_VERSION}/${profileId}/stories?fields=id,caption,media_type,timestamp,permalink,thumbnail_url,media_url&limit=${limit}&access_token=${accessToken}`
    ),
};
