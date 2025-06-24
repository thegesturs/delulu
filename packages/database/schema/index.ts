// Export all schemas and basic relations
export * from './user/user.sql';
export * from './post/post.sql';
export * from './social/social.sql';

// Export complete cross-schema relations
export * from './relations';

// Export all enums for easier imports
export { 
  postStatusEnum, 
  postReviewStatusEnum, 
  privacyStatusEnum 
} from './post/post.sql';

export { 
  socialTypeEnum, 
  currentPlanEnum 
} from './social/social.sql';

// Export all queries for easier imports
export { userQueries } from './user/user.queries';
export { postQueries } from './post/post.queries';
export { socialQueries } from './social/social.queries';