import type {
  Post as PrismaPost,
  SocialProvider as PrismaSocialProvider,
} from '@delulu/database';
import type { ContentType } from '@delulu/validators/post';

// Frontend-specific types that extend the database types
export interface SocialProvider
  extends Omit<
    PrismaSocialProvider,
    | 'createdAt'
    | 'updatedAt'
    | 'organization'
    | 'user'
    | 'posts'
    | 'alternateContents'
    | 'platformPosts'
  > {
  connected: boolean; // Derived from isActive for UI purposes
}

export interface Post
  extends Omit<
    PrismaPost,
    | 'createdAt'
    | 'updatedAt'
    | 'organization'
    | 'user'
    | 'alternateContents'
    | 'platformPosts'
    | 'content'
  > {
  content: ContentType[];
  socialProviders: SocialProvider[];
}

export type PostLayout = 'grid' | 'list';
