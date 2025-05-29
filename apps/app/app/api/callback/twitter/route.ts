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

interface ErrorResponse {
  error: string;
  code: string;
  redirectUrl?: string;
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!userId) {
    return NextResponse.redirect(
      new URL(
        '/socials?error=auth_required&code=AUTH_001',
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }

  if (!state || !code) {
    return NextResponse.redirect(
      new URL(
        '/socials?error=invalid_request&code=PARAM_001',
        env.NEXT_PUBLIC_APP_URL
      )
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
      console.error('Twitter token fetch error:', error);
      return NextResponse.redirect(
        new URL(
          '/socials?error=twitter_auth_failed&code=TWITTER_001',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=twitter_token_invalid&code=TWITTER_002',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const response: TwitterResponse = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = response;

    // Replace Twitter SDK with direct fetch call
    const userResponse = await fetch(
      'https://api.twitter.com/2/users/me?user.fields=username,profile_image_url,name,id',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=twitter_user_fetch_failed&code=TWITTER_003',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const { data: userObject } =
      (await userResponse.json()) as TwitterUserResponse;

    if (!userObject) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=twitter_user_fetch_failed&code=TWITTER_003',
          env.NEXT_PUBLIC_APP_URL
        )
      );
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

    // If found, we need to handle the transfer
    if (existingProvider) {
      // Update the userId to the current user
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
    return NextResponse.redirect(
      new URL(
        '/socials?error=internal_error&code=INTERNAL_001',
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}

export const POST = GET;
export const PUT = GET;
