'use server';

import { withAuth } from '@/lib/server-auth';

// Simple hello endpoint
export const hello = withAuth(
  // biome-ignore lint/suspicious/useAwait: <explanation>
  async (userId: string, text?: string) => {
    return {
      greeting: `Hello ${text ?? 'world'}`,
      userId: userId,
    };
  }
);