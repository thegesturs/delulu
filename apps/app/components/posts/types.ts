import type { ApiPost as BackendApiPost } from '@delulu/api/db/types/post.types';

// Frontend-specific types that extend or alias the backend API types

// Use the API's SocialProvider type directly

// The Post type for the frontend should align with what the API provides.
export type Post = BackendApiPost;

// If you need to add purely frontend-specific properties to Post, you can extend it:
// export interface Post extends BackendApiPost {
//   uiSpecificFlag?: boolean;
// }

export type PostLayout = 'grid' | 'list';
