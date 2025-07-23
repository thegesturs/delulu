'use server';

import { auth } from '@clerk/nextjs/server';
import { api } from '@delulu/database/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { createErrorResponse, type ServerActionResult } from './types';

// Get authenticated user from Clerk
export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  const user = await fetchQuery(api.users.getUserByExternalId, {
    externalId: userId,
  });
  
  if (!user?._id) {
    throw new Error('User not found in database');
  }
  
  return { clerkUserId: userId, dbUserId: user._id };
}

// Wrapper for server actions with auth and error handling
export function withAuth<T, P extends unknown[]>(
  action: (userId: string, ...args: P) => Promise<T>
) {
  return async (...args: P): Promise<ServerActionResult<T>> => {
    try {
      const { dbUserId } = await getAuthenticatedUser();
      const result = await action(dbUserId, ...args);
      return { success: true, data: result };
    } catch (error) {
      // Log error for debugging (could be replaced with proper logging service)
      if (process.env.NODE_ENV === 'development') {
        console.error('Server action error:', error);
      }
      return createErrorResponse(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };
}

// Helper to validate required parameters
export function validateRequired<T>(value: T | undefined | null, fieldName: string): T {
  if (value === undefined || value === null || value === '') {
    throw new Error(`${fieldName} is required`);
  }
  return value;
}