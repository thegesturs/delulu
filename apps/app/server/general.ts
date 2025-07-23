'use server';

import { executeWithAuth } from '@/lib/server-auth';

// Simple hello endpoint
export async function hello(text?: string) {
  return executeWithAuth(async (userId: string, text?: string) => {
    return {
      greeting: `Hello ${text ?? 'world'}`,
      userId: userId,
    };
  }, text);
}