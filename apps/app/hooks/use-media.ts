'use client';

import {
  createMedia,
  deleteMedia,
  getMediaById,
  getMediaByBucketKey,
  getMediaStats,
  getUserMedia,
  updateMedia,
} from '@/server/media';
import type {
  CreateMediaInput,
  MediaQueryParams,
  UpdateMediaInput,
} from '@/server/types';
import { useServerActionMutation, useServerActionQuery } from './use-server-actions';

// Get user's media with pagination and filtering
export function useGetUserMedia(params?: MediaQueryParams) {
  return useServerActionQuery(
    'getUserMedia',
    getUserMedia,
    params,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

// Get media by ID
export function useGetMediaById(id: string, enabled = true) {
  return useServerActionQuery(
    'getMediaById',
    getMediaById,
    id,
    { enabled: enabled && !!id }
  );
}

// Get media by bucket key
export function useGetMediaByBucketKey(bucketKey: string, enabled = true) {
  return useServerActionQuery(
    'getMediaByBucketKey', 
    getMediaByBucketKey,
    bucketKey,
    { enabled: enabled && !!bucketKey }
  );
}

// Get media stats
export function useGetMediaStats() {
  return useServerActionQuery(
    'getMediaStats',
    getMediaStats,
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

// Create media mutation
export function useCreateMedia(options?: {
  onSuccess?: (data: string) => void;
  onError?: (error: string) => void;
}) {
  return useServerActionMutation<string, CreateMediaInput>(
    createMedia,
    {
      ...options,
      invalidateQueries: ['getUserMedia', 'getMediaStats'],
    }
  );
}

// Update media mutation
export function useUpdateMedia(options?: {
  onSuccess?: (data: boolean) => void;
  onError?: (error: string) => void;
}) {
  return useServerActionMutation<boolean, UpdateMediaInput>(
    updateMedia,
    {
      ...options,
      invalidateQueries: ['getUserMedia', 'getMediaById', 'getMediaByBucketKey'],
    }
  );
}

// Delete media mutation
export function useDeleteMedia(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useServerActionMutation<void, string>(
    deleteMedia,
    {
      ...options,
      invalidateQueries: ['getUserMedia', 'getMediaStats'],
    }
  );
}