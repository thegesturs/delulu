import { socialQueries } from '@delulu/database';
import { getValidMediaUrls } from '@delulu/validators/post';
import axios from 'axios';
import {
  ResultAsync,
  err,
  errAsync,
  ok,
  okAsync,
} from 'neverthrow';

import type {
  BaseProviderProfile,
  PostContent,
  PostPublishResult,
} from './common-types';
import {
  MediaUploadError,
  NoContentError,
  ProfileNotFoundError,
  SocialProviderError,
  createAPIError,
} from './errors';
import type { SocialProvider } from './types';

// Bluesky API types
interface BlueskyProfile extends BaseProviderProfile {
  refreshToken: string;
}

interface BlueskyPostResponse {
  uri: string;
  cid: string;
}

interface BlueskyBlobResponse {
  blob: {
    $type: string;
    ref: {
      $link: string;
    };
    mimeType: string;
    size: number;
  };
}

interface BlueskyAuthResponse {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
}

// Bluesky-specific error
class BlueskyError extends SocialProviderError {
  readonly code = 'BLUESKY_ERROR';
  readonly provider = 'Bluesky';
  
  constructor(message: string) {
    super(message);
    this.name = 'BlueskyError';
  }
}

// Profile management
const getProfile = (
  socialProviderId: string
): ResultAsync<BlueskyProfile, SocialProviderError> =>
  ResultAsync.fromPromise(
    socialQueries.getSocialProviderWithDecryptedTokens(socialProviderId),
    () => new BlueskyError('Database query failed')
  ).andThen((profile) => {
    if (!profile?.accessToken || !profile.profileId || !profile.refreshToken) {
      return err(new ProfileNotFoundError('Bluesky'));
    }
    return ok({
      id: profile.id,
      profileId: profile.profileId,
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken,
      username: profile.username!,
    });
  });

// Authentication with Bluesky - use existing access token from OAuth
const authenticateWithBluesky = (
  profile: BlueskyProfile
): ResultAsync<BlueskyAuthResponse, SocialProviderError> => {
  // In OAuth flow, we already have a valid access token
  // Just return the profile data formatted as auth response
  return okAsync({
    accessJwt: profile.accessToken,
    refreshJwt: profile.refreshToken,
    handle: profile.username,
    did: profile.profileId, // DID is stored as profileId
  });
};

// Upload media blob to Bluesky
const uploadMediaBlob = (
  mediaUrl: string,
  accessToken: string
): ResultAsync<BlueskyBlobResponse, SocialProviderError> => {
  return ResultAsync.fromPromise(
    fetch(mediaUrl),
    () => new MediaUploadError('Bluesky', 'IMAGE')
  ).andThen((response) => {
    if (!response.ok) {
      return errAsync(new MediaUploadError('Bluesky', 'IMAGE'));
    }
    return ResultAsync.fromPromise(
      response.arrayBuffer(),
      () => new MediaUploadError('Bluesky', 'IMAGE')
    );
  }).andThen((arrayBuffer) => {
    return ResultAsync.fromPromise(
      axios.post(
        'https://bsky.social/xrpc/com.atproto.repo.uploadBlob',
        arrayBuffer,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/octet-stream',
          },
        }
      ),
      (error) => createAPIError('Bluesky', error)
    );
  }).map((response) => response.data);
};

// AT Protocol facet types
interface FacetIndex {
  byteStart: number;
  byteEnd: number;
}

interface LinkFeature {
  $type: 'app.bsky.richtext.facet#link';
  uri: string;
}

interface MentionFeature {
  $type: 'app.bsky.richtext.facet#mention';
  did: string;
}

interface RichTextFacet {
  index: FacetIndex;
  features: (LinkFeature | MentionFeature)[];
}

interface RichTextResult {
  text: string;
  facets?: RichTextFacet[];
}

// Create rich text with facets for mentions and links according to AT Protocol specs
const createRichText = (text: string): RichTextResult => {
  const facets: RichTextFacet[] = [];
  
  // Find URLs - more comprehensive regex
  const urlRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&=]*)/g;
  let urlMatch: RegExpExecArray | null;
  
  while ((urlMatch = urlRegex.exec(text)) !== null) {
    const start = new TextEncoder().encode(text.substring(0, urlMatch.index)).length;
    const end = start + new TextEncoder().encode(urlMatch[0]).length;
    
    facets.push({
      index: {
        byteStart: start,
        byteEnd: end,
      },
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          uri: urlMatch[0],
        },
      ],
    });
  }
  
  // Find mentions - @handle.domain or @handle
  const mentionRegex = /@([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?/g;
  let mentionMatch: RegExpExecArray | null;
  
  while ((mentionMatch = mentionRegex.exec(text)) !== null) {
    const start = new TextEncoder().encode(text.substring(0, mentionMatch.index)).length;
    const end = start + new TextEncoder().encode(mentionMatch[0]).length;
    
    // For mentions, we'd need to resolve the handle to a DID
    // For now, we'll just include the mention without a DID (basic text formatting)
    facets.push({
      index: {
        byteStart: start,
        byteEnd: end,
      },
      features: [
        {
          $type: 'app.bsky.richtext.facet#mention',
          did: `at://${mentionMatch[0].substring(1)}`, // Remove @ and use as handle
        },
      ],
    });
  }
  
  return {
    text,
    facets: facets.length > 0 ? facets : undefined,
  };
};

// AT Protocol post record types
interface BlueskyImageEmbed {
  $type: 'app.bsky.embed.images';
  images: Array<{
    alt: string;
    image: {
      $type: string;
      ref: { $link: string };
      mimeType: string;
      size: number;
    };
  }>;
}

interface BlueskyReply {
  root: { uri: string; cid: string };
  parent: { uri: string; cid: string };
}

interface BlueskyPostRecord {
  $type: 'app.bsky.feed.post';
  text: string;
  createdAt: string;
  facets?: RichTextFacet[];
  reply?: BlueskyReply;
  embed?: BlueskyImageEmbed;
}

// Create a post on Bluesky
const createPost = (
  content: PostContent,
  authResponse: BlueskyAuthResponse,
  replyTo?: { uri: string; cid: string }
): ResultAsync<BlueskyPostResponse, SocialProviderError> => {
  const validMedia = getValidMediaUrls(content.media);
  const richText = createRichText(content.text);
  
  // Process media uploads first - filter out media without URLs
  const mediaWithUrls = validMedia.filter((media) => media.url);
  const mediaUploadPromises = mediaWithUrls.map((media) => 
    uploadMediaBlob(media.url!, authResponse.accessJwt)
  );
  
  return ResultAsync.combine(mediaUploadPromises).andThen((mediaBlobs) => {
    const record: BlueskyPostRecord = {
      $type: 'app.bsky.feed.post',
      text: richText.text,
      createdAt: new Date().toISOString(),
    };
    
    // Add facets for rich text
    if (richText.facets) {
      record.facets = richText.facets;
    }
    
    // Add reply information
    if (replyTo) {
      record.reply = {
        root: replyTo,
        parent: replyTo,
      };
    }
    
    // Add embedded media
    if (mediaBlobs.length > 0) {
      if (mediaBlobs.length === 1) {
        record.embed = {
          $type: 'app.bsky.embed.images',
          images: [
            {
              alt: content.text.substring(0, 100), // Use first 100 chars as alt text
              image: mediaBlobs[0].blob,
            },
          ],
        };
      } else {
        record.embed = {
          $type: 'app.bsky.embed.images',
          images: mediaBlobs.map((blob) => ({
            alt: content.text.substring(0, 100),
            image: blob.blob,
          })),
        };
      }
    }
    
    return ResultAsync.fromPromise(
      axios.post(
        'https://bsky.social/xrpc/com.atproto.repo.createRecord',
        {
          repo: authResponse.did,
          collection: 'app.bsky.feed.post',
          record,
        },
        {
          headers: {
            'Authorization': `Bearer ${authResponse.accessJwt}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      (error) => createAPIError('Bluesky', error)
    );
  }).map((response) => response.data);
};

// Main publish function
const publishContent = (
  content: { content: PostContent[]; postId: string },
  profile: BlueskyProfile
): ResultAsync<PostPublishResult, SocialProviderError> => {
  const posts = content.content.sort((a, b) => a.order - b.order);
  
  if (posts.length === 0) {
    return errAsync(new NoContentError('Bluesky'));
  }
  
  return authenticateWithBluesky(profile).andThen((authResponse) => {
    // Process posts sequentially to maintain thread order
    const processSequentially = (
      remainingPosts: PostContent[],
      lastPost?: { uri: string; cid: string }
    ): ResultAsync<BlueskyPostResponse, SocialProviderError> => {
      const [currentPost, ...nextPosts] = remainingPosts;
      
      return createPost(currentPost, authResponse, lastPost)
        .andThen((postResponse) => {
          if (nextPosts.length > 0) {
            return processSequentially(nextPosts, postResponse);
          }
          return okAsync(postResponse);
        });
    };
    
    return processSequentially(posts).map((postResponse) => {
      // Extract the record key from the AT-URI for the post URL
      const uriParts = postResponse.uri.split('/');
      const recordKey = uriParts[uriParts.length - 1] || '';
      
      return {
        platformPostId: postResponse.uri,
        postId: content.postId,
        platformId: profile.id,
        platformPostUrl: `https://bsky.app/profile/${authResponse.handle}/post/${recordKey}`,
        postedAt: new Date(),
      };
    });
  });
};

// Provider implementation
export const blueskyProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const result = await getProfile(socialProviderId).andThen((profile) =>
      publishContent(content, profile)
    );
    return result;
  },
  
  connectUrl: () => {
    // Bluesky OAuth URL - uses client metadata URL as client_id
    const params = new URLSearchParams({
      client_id: 'https://delulu.social/oauth/bluesky-client.json', // Client metadata URL
      redirect_uri: 'https://delulu.social/api/callback/bluesky',
      response_type: 'code',
      scope: 'atproto transition:generic',
      code_challenge_method: 'S256',
      // code_challenge would be generated dynamically in real implementation
    });
    
    return `https://bsky.social/oauth/authorize?${params.toString()}`;
  },
};