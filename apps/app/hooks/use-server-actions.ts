'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ServerActionResult } from '@/server/types';

// Generic hook for server action mutations
export function useServerActionMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ServerActionResult<TData>>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: string, variables: TVariables) => void;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await mutationFn(variables);
      if (!result.success) {
        throw new Error(result.error || 'Server action failed');
      }
      return result.data as TData;
    },
    onSuccess: (data, variables) => {
      options?.onSuccess?.(data, variables);
      // Invalidate queries if specified
      if (options?.invalidateQueries) {
        for (const queryKey of options.invalidateQueries) {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        }
      }
    },
    onError: (error: Error, variables) => {
      options?.onError?.(error.message, variables);
    },
  });
}

// Generic hook for server action queries
export function useServerActionQuery<TData, TVariables = void>(
  queryKey: string,
  queryFn: (variables: TVariables) => Promise<ServerActionResult<TData>>,
  variables?: TVariables,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
  }
) {
  return useQuery({
    queryKey: [queryKey, variables],
    queryFn: async () => {
      const result = await queryFn(variables as TVariables);
      if (!result.success) {
        throw new Error(result.error || 'Server action failed');
      }
      return result.data as TData;
    },
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  });
}