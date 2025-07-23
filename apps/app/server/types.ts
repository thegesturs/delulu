'use server';

import type { Id } from '@delulu/database/convex/_generated/dataModel';

// Server action response wrapper
export type ServerActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Create successful response
export function createSuccessResponse<T>(data: T): ServerActionResult<T> {
  return { success: true, data };
}

// Create error response
export function createErrorResponse(error: string): ServerActionResult<never> {
  return { success: false, error };
}

// Media types
export type MediaType = 'IMAGE' | 'VIDEO';

export interface MediaItem {
  _id: Id<'media'>;
  _creationTime: number;
  userId: Id<'users'>;
  bucketKey: string;
  url: string;
  mediaType: MediaType;
  originalFilename?: string;
  size?: number;
  extension?: string;
  altText?: string;
  bucketUrl?: string;
  thumbnailBucketUrl?: string;
  thumbnailBucketKey?: string;
}

export interface MediaQueryParams {
  limit?: number;
  cursor?: number;
  mediaType?: MediaType;
  search?: string;
}

export interface MediaQueryResult {
  media: MediaItem[];
  hasMore: boolean;
  nextCursor?: number;
}

export interface CreateMediaInput {
  bucketKey: string;
  url: string;
  mediaType: MediaType;
  originalFilename?: string;
  size?: number;
  extension?: string;
  altText?: string;
  bucketUrl?: string;
  thumbnailBucketUrl?: string;
  thumbnailBucketKey?: string;
}

export interface UpdateMediaInput {
  id: string;
  altText?: string;
  originalFilename?: string;
}

// Social provider types
export interface FacebookPageConnectionInput {
  pageId: string;
  pageName: string;
  code: string;
}

export interface CreatePostInput {
  content: string;
  socialProviders: Array<{ socialId: string }>;
  alternativeContent: Array<{
    socialProvider: { socialId: string };
    content: string;
  }>;
  id?: string;
}

export interface CreatePostFromIdInput {
  postId: string;
}

export type SocialType = 'FACEBOOK' | 'INSTAGRAM' | 'TWITTER' | 'LINKEDIN' | 'TIKTOK' | 'PINTEREST' | 'THREADS' | 'FARCASTER';

// Return types for server actions
export interface MediaStats {
  totalCount: number;
  imageCount: number;
  videoCount: number;
  totalSize: number;
}

export interface ConnectUrlResponse {
  connectUrl: string;
}

export interface PostSuccessResponse {
  success: boolean;
}

export interface FacebookConnectionResponse {
  status: string;
}