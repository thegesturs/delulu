import { getAuth } from '@delulu/auth/server';
import { database } from '@delulu/database';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '@/env';
import { nanoid } from 'nanoid';

interface TwitterResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

const TIMEOUT_MS = 8000; // 8 seconds timeout

// Helper function to handle fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = TIMEOUT_MS
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!userId) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=auth_required&code=AUTH_001&provider=TWITTER',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    if (!state || !code) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=invalid_request&code=PARAM_001&provider=TWITTER',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const bearerToken = Buffer.from(
      `${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    // Get Twitter access token with timeout
    const tokenResponse = await fetchWithTimeout(
      'https://api.twitter.com/2/oauth2/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${bearerToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: env.TWITTER_CALLBACK_URL,
          code_verifier: 'challenge',
        }),
      }
    ).catch((error) => {
      console.error('Twitter token fetch error:', error);
      throw new Error('twitter_auth_failed');
    });

    if (!tokenResponse.ok) {
      throw new Error('twitter_token_invalid');
    }

    const response: TwitterResponse = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = response;

    // Get Twitter user data with timeout
    const userResponse = await fetchWithTimeout(
      'https://api.twitter.com/2/users/me?user.fields=username,profile_image_url,name,id',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('twitter_user_fetch_failed');
    }

    const { data: userObject } =
      (await userResponse.json()) as TwitterUserResponse;

    if (!userObject) {
      throw new Error('twitter_user_fetch_failed');
    }

    // Check if this Twitter account is already connected to a different user
    const existingProvider = await database.socialProvider.findFirst({
      where: {
        profileId: userObject.id,
        NOT: {
          userId: userId,
        },
      },
    });

    // If found, handle the transfer
    if (existingProvider) {
      await database.socialProvider.update({
        where: {
          id: existingProvider.id,
        },
        data: {
          userId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: new Date(Date.now() + expires_in * 1000),
          fullName: userObject.name ?? '',
          username: userObject.username,
          profileImage: userObject.profile_image_url ?? '',
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.redirect(
        new URL(
          '/socials?notification=account_transferred&platform=twitter',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Use upsert to either create or update the social provider
    await database.socialProvider.upsert({
      where: {
        userId_profileId: {
          userId,
          profileId: userObject.id,
        },
      },
      create: {
        id: `social_${nanoid(12)}`,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: new Date(Date.now() + expires_in * 1000),
        fullName: userObject.name ?? '',
        username: userObject.username,
        profileImage: userObject.profile_image_url ?? '',
        profileId: userObject.id,
        userId,
        socialType: 'TWITTER',
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: new Date(Date.now() + expires_in * 1000),
        fullName: userObject.name ?? '',
        username: userObject.username,
        profileImage: userObject.profile_image_url ?? '',
        updatedAt: new Date(),
        isActive: true,
        lastSyncedAt: new Date(),
        userId,
      },
    });

    return NextResponse.redirect(new URL('/socials', env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error('Twitter callback error:', error);
    const errorType = error instanceof Error ? error.message : 'internal_error';
    return NextResponse.redirect(
      new URL(
        `/socials?error=${errorType}&code=TWITTER_ERR&provider=TWITTER`,
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}

export const POST = GET;
export const PUT = GET;
