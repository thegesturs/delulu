import { keys } from '@delulu/api/keys';
import { auth } from '@delulu/auth/server';
import { and, database, eq, ne, socialProviders } from '@delulu/database';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
}

interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

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
    throw new Error('Request timed out');
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=auth_required&code=AUTH_001&provider=instagram',
        },
      });
    }

    const userId = session.user.id;

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');

    // Handle user denying access
    if (error === 'access_denied' && errorReason === 'user_denied') {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_denied&code=INSTAGRAM_001&provider=instagram',
        },
      });
    }

    if (!code) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=invalid_request&code=PARAM_001&provider=instagram',
        },
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetchWithTimeout(
      'https://api.instagram.com/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: keys().INSTAGRAM_CLIENT_ID,
          client_secret: keys().INSTAGRAM_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: keys().INSTAGRAM_CALLBACK_URL,
          code,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        'Instagram token exchange failed:',
        await tokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=INSTAGRAM_002&provider=instagram',
        },
      });
    }

    const tokenData = (await tokenResponse.json()) as InstagramTokenResponse;

    // Exchange short-lived token for long-lived token
    const longLivedTokenResponse = await fetchWithTimeout(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${
        keys().INSTAGRAM_CLIENT_SECRET
      }&access_token=${tokenData.access_token}`,
      {
        method: 'GET',
      }
    );

    if (!longLivedTokenResponse.ok) {
      console.error(
        'Instagram long-lived token exchange failed:',
        await longLivedTokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=INSTAGRAM_003&provider=instagram',
        },
      });
    }

    const longLivedTokenData =
      (await longLivedTokenResponse.json()) as InstagramLongLivedTokenResponse;

    // Get user profile information
    const userResponse = await fetchWithTimeout(
      `https://graph.instagram.com/v23.0/me?fields=id,name,username,account_type,profile_picture_url&access_token=${longLivedTokenData.access_token}`,
      {
        method: 'GET',
      }
    );

    if (!userResponse.ok) {
      console.error('Instagram user fetch failed:', await userResponse.text());
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_fetch_failed&code=INSTAGRAM_004&provider=instagram',
        },
      });
    }

    const userObject = await userResponse.json();

    // Check if this Instagram account is already connected to a different user
    const existingProvider = await database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.profileId, userObject.id),
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
          accessToken: longLivedTokenData.access_token,
          expiresIn: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          fullName: userObject.name,
          username: userObject.username,
          profileImage: userObject.profile_picture_url,
          updatedAt: new Date(),
          refreshTokenExpiresIn: new Date(
            Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
          ),
          isActive: true,
          lastSyncedAt: new Date(),
        })
        .where(eq(socialProviders.id, existingProvider[0].id));

      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?notification=account_transferred&platform=instagram',
        },
      });
    }

    // Upsert the social provider using conflict resolution
    await database
      .insert(socialProviders)
      .values({
        id: `social_${nanoid(12)}`,
        userId,
        socialType: 'INSTAGRAM',
        accessToken: longLivedTokenData.access_token,
        expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        profileId: userObject.id,
        username: userObject.username,
        fullName: userObject.name,
        profileImage: userObject.profile_picture_url,
        refreshTokenExpiresIn: new Date(
          Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
        ),
        isActive: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [socialProviders.userId, socialProviders.profileId],
        set: {
          accessToken: longLivedTokenData.access_token,
          expiresIn: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          fullName: userObject.name,
          username: userObject.username,
          profileImage: userObject.profile_picture_url,
          updatedAt: new Date(),
          refreshTokenExpiresIn: new Date(
            Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
          ),
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

    // Successful connection
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/socials?success=true&provider=instagram',
      },
    });
  } catch (error) {
    console.error('Instagram callback error:', error);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location:
          '/socials?error=server_error&code=INSTAGRAM_500&provider=instagram',
      },
    });
  }
}
