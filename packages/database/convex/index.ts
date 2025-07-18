// Export all Convex functions for easy importing
// This file serves as the main entry point for the Convex database migration

// Export schema
export { default as schema } from './schema';

// Export utilities
export * from './utils';

// Export user functions
export * from './users';

// Export post functions
export * from './posts';

// Export social provider functions
export * from './social_providers';

// Export media functions
export * from './media';

// Export cascade delete functions
export * from './cascade_deletes';

// Type exports for external use
export type {
  SocialType,
  PostStatus,
  PostReviewStatus,
  PrivacyStatus,
  MediaType,
  UniqueIdsType,
} from './utils';

// Common query patterns for migration reference
export const queryPatterns = {
  // User patterns
  getUserById: 'users.getUserById',
  getUserByEmail: 'users.getUserByEmail',
  createUser: 'users.createUser',
  updateUser: 'users.updateUser',
  deleteUser: 'users.deleteUser',

  // Post patterns
  getPostById: 'posts.getPostById',
  getPostsByUserId: 'posts.getPostsByUserId',
  createPost: 'posts.createPost',
  updatePost: 'posts.updatePost',
  deletePost: 'cascadeDeletes.deletePostWithCascade',

  // Social provider patterns
  getSocialProviderById: 'socialProviders.getSocialProviderById',
  getUserSocialProviders: 'socialProviders.getUserSocialProviders',
  createSocialProvider: 'socialProviders.createSocialProvider',
  updateSocialProvider: 'socialProviders.updateSocialProvider',
  deleteSocialProvider: 'cascadeDeletes.deleteSocialProviderWithCascade',

  // Media patterns
  getMediaById: 'media.getMediaById',
  getMediaByUserId: 'media.getMediaByUserId',
  createMedia: 'media.createMedia',
  updateMedia: 'media.updateMedia',
  deleteMedia: 'media.deleteMedia',

  // Cascade delete patterns
  deleteUserWithCascade: 'cascadeDeletes.deleteUserWithCascade',
  deleteSocialProviderWithCascade:
    'cascadeDeletes.deleteSocialProviderWithCascade',
  deletePostWithCascade: 'cascadeDeletes.deletePostWithCascade',
  cleanupOrganizationData: 'cascadeDeletes.cleanupOrganizationData',
};

// Helper function to get the correct function reference for the API
export function getFunctionReference(
  pattern: keyof typeof queryPatterns
): string {
  return queryPatterns[pattern];
}

// Common validation patterns
export const validationPatterns = {
  email: 'Use isValidEmail() from utils',
  url: 'Use isValidUrl() from utils',
  timestamp: 'Use getCurrentTimestamp() for current time',
  futureTimestamp: 'Use isFutureTimestamp() to validate future dates',
  pastTimestamp: 'Use isPastTimestamp() to validate past dates',
  customIds: 'Use createUniqueIds() for generating custom IDs',
};
