'use client';

import {
  connectFacebookPage,
  createPost,
  createPostFromPostId,
  getSocialProviderConnectUrl,
} from '@/server/social-providers';
import type {
  CreatePostFromIdInput,
  CreatePostInput,
  FacebookPageConnectionInput,
} from '@/server/types';
import type { SocialType } from '@delulu/database/convex';
import { useServerActionMutation } from './use-server-actions';

// Get social provider connect URL
export function useGetSocialProviderConnectUrl(options?: {
  onSuccess?: (data: { connectUrl: string }) => void;
  onError?: (error: string) => void;
}) {
  console.log('useGetSocialProviderConnectUrl');
  return useServerActionMutation<{ connectUrl: string }, SocialType>(
    getSocialProviderConnectUrl,
    options
  );
}

// Create post mutation
export function useCreatePost(options?: {
  onSuccess?: (data: { success: boolean }) => void;
  onError?: (error: string) => void;
}) {
  return useServerActionMutation<{ success: boolean }, CreatePostInput>(
    createPost,
    {
      ...options,
      invalidateQueries: ['posts'], // Invalidate posts-related queries
    }
  );
}

// Create post from existing post ID
export function useCreatePostFromPostId(options?: {
  onSuccess?: (data: { success: boolean }) => void;
  onError?: (error: string) => void;
}) {
  return useServerActionMutation<{ success: boolean }, CreatePostFromIdInput>(
    createPostFromPostId,
    {
      ...options,
      invalidateQueries: ['posts'],
    }
  );
}

// Connect Facebook page
export function useConnectFacebookPage(options?: {
  onSuccess?: (data: { status: string }) => void;
  onError?: (error: string) => void;
}) {
  return useServerActionMutation<
    { status: string },
    FacebookPageConnectionInput
  >(connectFacebookPage, {
    ...options,
    invalidateQueries: ['socialProviders'], // Invalidate social providers queries
  });
}
