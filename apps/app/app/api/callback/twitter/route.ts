import { randomUUID } from 'node:crypto';
import { getAuth } from '@delulu/auth/server';
import { database } from '@delulu/database';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Client } from 'twitter-api-sdk';

import { env } from '@/env';

interface TwitterResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!state || !code) {
    return NextResponse.json(
      { error: 'Invalid request: Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    const bearerToken = Buffer.from(
      `${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    const tokenResponse = await fetch(
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
      return NextResponse.json(
        { error: 'Failed to process Twitter authentication' },
        { status: 500 }
      );
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to obtain access token');
    }

    const response: TwitterResponse = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = response;

    const client = new Client(access_token);
    const { data: userObject } = await client.users.findMyUser({
      'user.fields': ['username', 'profile_image_url', 'name', 'id'],
    });

    if (!userObject) {
      throw new Error('Failed to fetch user data');
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
        id: `sp_${randomUUID()}`,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: new Date(new Date().getTime() + expires_in * 1000),
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
        expiresIn: new Date(new Date().getTime() + expires_in * 1000),
        fullName: userObject.name ?? '',
        username: userObject.username,
        profileImage: userObject.profile_image_url ?? '',
        updatedAt: new Date(),
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL('/socials', env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.json(
      { error: 'Failed to process Twitter authentication' },
      { status: 500 }
    );
  }
}

export const POST = GET;
export const PUT = GET;
