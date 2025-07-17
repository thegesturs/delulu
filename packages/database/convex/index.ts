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
export * from './socialProviders';

// Export media functions
export * from './media';

// Export cascade delete functions
export * from './cascadeDeletes';

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

// Migration notes and differences from PostgreSQL
export const migrationNotes = {
  changes: {
    // Key changes made during migration
    embeddedRelationships:
      'Posts now embed social provider IDs and alternative content instead of separate tables',
    embeddedUserUsage:
      'User usage is now embedded in the users table instead of a separate table',
    customIdGeneration:
      'Using custom ID generation with prefixes (user_, post_, etc.) instead of auto-incrementing IDs',
    timestampsAsNumbers:
      'All timestamps are stored as numbers (milliseconds since epoch) instead of Date objects',
    encryptedTokens:
      'Social provider tokens are encrypted before storage and decrypted when needed',
    cascadeDeletes:
      'Cascade deletes are handled via mutations instead of database constraints',
    jsonContent: 'Post content is stored as JSON arrays with proper validation',
    externalMediaStorage:
      'Media table keeps the same external storage approach (S3, etc.)',
  },

  benefits: {
    // Benefits of the Convex migration
    realTimeUpdates: 'Automatic real-time updates when data changes',
    betterPerformance: 'Optimized queries with proper indexing',
    typeValidation: 'Built-in type validation with Convex validators',
    simplifiedQueries: 'Easier to write and maintain queries',
    scalability: "Better scalability with Convex's infrastructure",
    lessComplexity: 'Reduced complexity with embedded relationships',
  },

  removedTables: {
    // Tables that were removed and their replacements
    postSocialProviders: 'Embedded as socialProviderIds array in posts table',
    alternatePostContent: 'Embedded as alternativeContent array in posts table',
    userUsage: 'Embedded as usage object in users table',
  },

  newPatterns: {
    // New patterns introduced in Convex
    cascadeDeletes: 'Use cascadeDeletes.* functions for proper cleanup',
    encryptedTokens: 'Use internal functions for decrypted token access',
    embeddedQueries:
      'Single queries now fetch complete objects with embedded data',
    timestampHelpers:
      'Use getCurrentTimestamp() for consistent timestamp handling',
  },
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
