import { database } from '@delulu/database';
import { TRPCError } from '@trpc/server';
import { Client } from 'twitter-api-sdk';
import type { SocialProvider } from './types';
import axios from 'axios';
import { keys } from './keys';
import { getFileType } from '@delulu/validators/post';

export const twitterProvider: SocialProvider = {
  publish: async ({ content, socialProviderId }) => {
    const profile = await getAccessTokenAndProfile(socialProviderId);

    if (!profile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Social provider not found',
      });
    }

    const client = new Client(profile.accessToken);

    const tweets = content.content
      .map((tweet) => {
        return {
          text: tweet.text,
          media: tweet.media,
          order: tweet.order,
        };
      })
      .sort((a, b) => a.order - b.order);

    const response = await client.tweets.createTweet({});
    return {
      platformPostId: '123',
      postId: '123',
      platformId: '123',
      platformPostUrl: 'https://twitter.com/123',
      postedAt: new Date(),
    };
  },
};

// Helper Functions

async function getAccessTokenAndProfile(tokenId: string) {
  const token = await database.socialProvider.findUnique({
    where: {
      id: tokenId,
    },
  });
  if (!token) {
    throw new Error('Token not found');
  }
  if (token.expiresIn && token.refreshToken && token.accessToken) {
    if (token.expiresIn < new Date()) {
      const bearerToken = Buffer.from(
        `${token.clientId}:${token.clientSecret}`
      ).toString('base64');
      try {
        const response = await fetch('https://api.twitter.com/2/oauth2/token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${bearerToken}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken,
          }),
        });

        const data = (await response.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };
        if (data) {
          await database.socialProvider.update({
            where: {
              id: tokenId,
            },
            data: {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresIn: new Date(Date.now() + data.expires_in * 1000),
              updatedAt: new Date(),
              lastSyncedAt: new Date(),
            },
          });
        }
        return { ...token, accessToken: data.access_token };
      } catch (err) {
        // await database.socialProvider.update({
        //   where: {
        //     id: tokenId,
        //   },
        //   data: {

        //   },
        // });
        console.error(err);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to refresh access token',
        });
      }
    } else {
      return token;
    }
  }
}

export async function uploadMediaToTwitter(
  fileUrl: string,
  profileId: string,
  accessToken: string
): Promise<string> {
  try {
    // Stream the file from the provided URL
    const fileResponse = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'arraybuffer',
    });
    const fileType = fileUrl.split('.').pop();

    // const v1Client = new TwitterApi({
    //   appKey: env.TWITTER_APIKEY,
    //   appSecret: env.TWITTER_APPSECRET,
    //   accessToken: env.TWITTER_ACCESSTOKEN,
    //   accessSecret: env.AWS_SECRET_ACCESS_KEY,
    // });
    const v2Client = new Client(accessToken);

    const mimeType = getFileType(fileUrl);
    // const mediaId = await v2Client.tweets.uploadMedia(fileResponse.data, {
    //   mimeType: mimeType + '/' + fileType,
    //   additionalOwners: [profileId],
    // });

    return mediaId;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw new Error('Failed to upload media');
  }
}
