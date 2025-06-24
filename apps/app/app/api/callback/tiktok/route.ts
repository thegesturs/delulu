import { env } from '@/env';
import { auth } from '@delulu/auth/server';
import { database, socialProviders } from '@delulu/database';
import { and, eq, ne } from '@delulu/database';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface TikTokResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
  scope: string;
}

// Helper function to fetch with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout = 5000
) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('code', code);
    console.log('state', state);

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=auth_required&code=AUTH_001&provider=TIKTOK',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const userId = session.user.id;

    if (!state || !code) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=invalid_request&code=PARAM_001&provider=TIKTOK',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetchWithTimeout(
      'https://open.tiktokapis.com/v2/oauth/token/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams({
          client_key: env.TIKTOK_CLIENT_ID,
          client_secret: env.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: env.TIKTOK_CALLBACK_URL,
        }),
      }
    ).catch((error) => {
      console.error('TikTok token fetch error:', error);
      throw new Error('tiktok_auth_failed');
    });

    console.log('tokenResponse', tokenResponse);

    if (!tokenResponse.ok) {
      throw new Error('tiktok_token_invalid');
    }

    const response: TikTokResponse = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, open_id } = response;

    // Get TikTok user data
    const userResponse = await fetchWithTimeout(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error('TikTok user fetch error:', await userResponse.text());
      throw new Error('tiktok_user_fetch_failed');
    }

    const userData = await userResponse.json();
    if (!userData.data?.user) {
      console.error('Invalid user data response:', userData);
      throw new Error('tiktok_invalid_user_data');
    }

    const { display_name, avatar_url } = userData.data.user;

    // Check if this TikTok account is already connected to a different user
    const existingProvider = await database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.profileId, open_id),
          ne(socialProviders.userId, userId)
        )
      )
      .limit(1);

    // If found, handle the transfer
    if (existingProvider.length > 0) {
      await database
        .update(socialProviders)
        .set({
          userId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: new Date(Date.now() + expires_in * 1000),
          fullName: display_name,
          username: display_name,
          profileImage: avatar_url,
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        })
        .where(eq(socialProviders.id, existingProvider[0].id));

      return NextResponse.redirect(
        new URL(
          '/socials?notification=account_transferred&platform=tiktok',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Upsert the social provider using conflict resolution
    await database
      .insert(socialProviders)
      .values({
        id: `social_${nanoid(12)}`,
        userId,
        socialType: 'TIKTOK',
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: new Date(Date.now() + expires_in * 1000),
        profileId: open_id,
        username: display_name,
        fullName: display_name,
        profileImage: avatar_url,
        isActive: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [socialProviders.userId, socialProviders.profileId],
        set: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: new Date(Date.now() + expires_in * 1000),
          fullName: display_name,
          username: display_name,
          profileImage: avatar_url,
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

    return NextResponse.redirect(
      new URL('/socials?success=true&provider=TIKTOK', env.NEXT_PUBLIC_APP_URL)
    );
  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.redirect(
      new URL(
        '/socials?error=auth_failed&code=AUTH_002&provider=TIKTOK',
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}
