import { auth } from '@clerk/nextjs/server';
import { api } from '@delulu/database/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { type ServerActionResult, createErrorResponse } from '../server/types';

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

// Helper function for server actions with auth and error handling
export async function executeWithAuth<T, P extends unknown[]>(
  action: (userId: string, ...args: P) => Promise<T>,
  ...args: P
): Promise<ServerActionResult<T>> {
  try {
    const { dbUserId } = await getAuthenticatedUser();
    const result = await action(dbUserId, ...args);
    return { success: true, data: result };
  } catch (error) {
    // Log error for debugging (could be replaced with proper logging service)
    if (process.env.NODE_ENV === 'development') {
      // biome-ignore lint/suspicious/noConsole: Debug logging in development
      console.error('Server action error:', error);
    }
    return createErrorResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}