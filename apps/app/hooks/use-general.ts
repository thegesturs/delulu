'use client';

import { hello } from '@/server/general';
import { useServerActionMutation } from './use-server-actions';

// Hello mutation (for testing)
export function useHello(options?: {
  onSuccess?: (data: { greeting: string; userId: string }) => void;
  onError?: (error: string) => void;
}) {
  return useServerActionMutation<
    { greeting: string; userId: string }, 
    string | undefined
  >(
    hello,
    options
  );
}