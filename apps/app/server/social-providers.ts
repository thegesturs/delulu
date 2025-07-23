'use server';

import { createPostInQueue } from '@delulu/api/services/post.service';
import { getCloudflareEnv } from '@delulu/cloudflare-types';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { decryptData } from '@delulu/database/convex/utils';
import {
  FacebookPageConnectionSchema,
  type FacebookPagesWithToken,
  FacebookPagesWithTokenSchema,
} from '@delulu/validators/facebook';
import { savePostInputSchema } from '@delulu/validators/post';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { connectUrlRegistry } from '@delulu/api/services/connect-url.service';
import type {
  ConnectUrlResponse,
  CreatePostFromIdInput,
  CreatePostInput,
  FacebookConnectionResponse,
  FacebookPageConnectionInput,
  PostSuccessResponse,
  SocialType,
} from './types';
import { validateRequired, withAuth } from './utils';

// Get social provider connect URL
export const getSocialProviderConnectUrl = withAuth(
  (_userId: string, provider: SocialType): Promise<ConnectUrlResponse> => {
    validateRequired(provider, 'Provider');
    
    // Validate provider type (exclude DEFAULT and LENS)
    const validProviders = ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK', 'PINTEREST', 'THREADS', 'FARCASTER'];
    if (!validProviders.includes(provider)) {
      throw new Error(`Invalid provider: ${provider}`);
    }

    const link = connectUrlRegistry[provider].connectUrl();
    
    return Promise.resolve({ connectUrl: link });
  }
);

// Create post
export const createPost = withAuth(
  async (userId: string, input: CreatePostInput): Promise<PostSuccessResponse> => {
    // Validate input with Zod schema  
    const validatedInput = savePostInputSchema.parse(input);
    
    if (validatedInput.id) {
      // Update existing post
      const post = await fetchQuery(api.posts.getPostById, {
        id: validatedInput.id as Id<'posts'>,
      });
      
      if (!post) {
        throw new Error('Post not found');
      }
      
      await createPostInQueue(post);
    } else {
      // Create new post
      const savePostId = await fetchMutation(api.posts.createPost, {
        userId: userId as Id<'users'>,
        content: validatedInput.content,
        status: 'SAVED',
        socialProviderIds: validatedInput.socialProviders.map(
          (sp) => sp.socialId as Id<'socialProviders'>
        ),
        alternativeContent: validatedInput.alternativeContent.map((alt) => ({
          socialProviderId: alt.socialProvider.socialId as Id<'socialProviders'>,
          content: alt.content,
        })),
      });

      if (!savePostId) {
        throw new Error('Failed to save post');
      }

      const post = await fetchQuery(api.posts.getPostById, {
        id: savePostId,
      });
      
      if (!post) {
        throw new Error('Post not found after creation');
      }
      
      await createPostInQueue(post);
    }

    return { success: true };
  }
);

// Create post from existing post ID
export const createPostFromPostId = withAuth(
  async (_userId: string, input: CreatePostFromIdInput): Promise<PostSuccessResponse> => {
    validateRequired(input.postId, 'Post ID');

    // Get the post with its related data
    const post = await fetchQuery(api.posts.getPostById, {
      id: input.postId as Id<'posts'>,
    });
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    if (!post.userId) {
      throw new Error('Post has no associated user');
    }

    await createPostInQueue(post);
    
    return { success: true };
  }
);

// Connect Facebook page
export const connectFacebookPage = withAuth(
  async (userId: string, input: FacebookPageConnectionInput): Promise<FacebookConnectionResponse> => {
    // Validate input
    const validatedInput = FacebookPageConnectionSchema.parse(input);
    
    // Securely retrieve the page access token from KV storage
    let pageAccessToken: string;
    
    try {
      const env = await getCloudflareEnv();
      const key = `fb-pages-${userId}-${validatedInput.code}`;

      // Type assertion for Cloudflare KV namespace
      const facebookPagesKV = env.DELULU_FACEBOOK_PAGES;
      const encryptedData = await facebookPagesKV.get(key);
      
      if (!encryptedData) {
        throw new Error('Facebook pages data not found or expired');
      }

      const decryptedData = await decryptData(encryptedData);
      const rawPages = JSON.parse(decryptedData);

      // Validate the data structure with Zod schema
      const pagesValidationResult = FacebookPagesWithTokenSchema.safeParse(rawPages);
      
      if (!pagesValidationResult.success) {
        throw new Error('Invalid Facebook pages data structure');
      }

      const pages: FacebookPagesWithToken = pagesValidationResult.data;

      const selectedPage = pages.find((page) => page.id === validatedInput.pageId);
      
      if (!selectedPage?.access_token) {
        throw new Error('Selected Facebook page not found');
      }

      pageAccessToken = selectedPage.access_token;

      // Clean up the KV storage entry after retrieving the token
      await facebookPagesKV.delete(key);
    } catch (error) {
      // Log error for debugging (could be replaced with proper logging service)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error retrieving Facebook page data:', error);
      }
      throw new Error('Failed to retrieve Facebook page data');
    }

    await fetchMutation(api.social_providers.connectFacebookPage, {
      userId: userId as Id<'users'>,
      pageId: validatedInput.pageId,
      pageName: validatedInput.pageName,
      accessToken: pageAccessToken,
    });

    return { status: 'connected' };
  }
);