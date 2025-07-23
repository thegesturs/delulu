'use server';

import { withAuth } from './utils';

// Simple hello endpoint
export const hello = withAuth(
  (userId: string, text?: string): Promise<{ greeting: string; userId: string }> => {
    return Promise.resolve({
      greeting: `Hello ${text ?? 'world'}`,
      userId: userId,
    });
  }
);