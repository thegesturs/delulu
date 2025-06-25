import * as post from './post/post.sql';
import * as social from './social/social.sql';
import * as user from './user/user.sql';

// Export all enums for easier imports
export {
  postStatusEnum,
  postReviewStatusEnum,
  privacyStatusEnum,
} from './post/post.sql';

export {
  socialTypeEnum,
  currentPlanEnum,
} from './social/social.sql';


// Export all queries for easier imports
export { userQueries } from './user/user.queries';
export { postQueries } from './post/post.queries';
export { socialQueries } from './social/social.queries';
export * from './user/user.sql';
export * from './post/post.sql';
export * from './social/social.sql';
