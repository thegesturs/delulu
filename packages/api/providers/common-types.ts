import type { MediaType, PostReturnType } from '@delulu/validators/post';

// Common provider profile interface
export interface BaseProviderProfile {
  id: string;
  accessToken: string;
}

// Extended profiles for providers that need additional fields
export interface FacebookProfile extends BaseProviderProfile {
  profileId: string;
}

export interface ThreadsProfile extends BaseProviderProfile {
  profileId: string;
}

export interface TikTokProfile extends BaseProviderProfile {
  refreshToken: string;
}

export interface TwitterProfile extends BaseProviderProfile {
  refreshToken: string;
  username: string;
}

// Content types
export interface PostContent {
  text: string;
  media: MediaType[];
  order: number;
  tags?: string[];
}

export interface PublishInput {
  content: {
    content: PostContent[];
    postId: string;
  };
  socialProviderId: string;
}

// Response types
export interface MediaUploadResult {
  id: string;
  url?: string;
}

export interface PostPublishResult extends PostReturnType {
  platformPostId: string;
  postId: string;
  platformId: string;
  platformPostUrl: string;
  postedAt: Date;
}

// Platform-specific API response types
export interface FacebookMediaUploadResponse {
  id: string;
  upload_url?: string;
}

export interface FacebookPostResponse {
  id: string;
  post_id?: string;
}

export interface FacebookPostDetails {
  id: string;
  permalink_url: string;
}

export interface ThreadsMediaContainer {
  id: string;
}

export interface ThreadsMediaPublishResponse {
  id: string;
}

export interface ThreadsMediaResponse {
  id: string;
  permalink: string;
  link_attachment_url?: string;
}

export interface YouTubeVideoUploadResponse {
  id: string;
  snippet: {
    title: string;
    description: string;
    tags?: string[];
    categoryId: string;
  };
  status: {
    uploadStatus: string;
    privacyStatus: string;
  };
}

export interface TikTokVideoUploadResponse {
  data: {
    publish_id: string;
  };
}

export interface PinterestBoardResponse {
  id: string;
  name: string;
}

export interface PinterestPinResponse {
  id: string;
  link: string;
}

export interface TwitterTweetResponse {
  data: {
    id: string;
    text: string;
  };
}