import { keys } from '@delulu/api/keys';
import { auth } from '@delulu/auth/server';
import { and, database, eq, ne, socialProviders } from '@delulu/database';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

interface PinterestTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  scope: string;
}

interface PinterestUserResponse {
  account_type: string;
  profile_image: string;
  website_url: string;
  username: string;
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
            '/socials?error=auth_required&code=AUTH_001&provider=pinterest',
        },
      });
    }

    const userId = session.user.id;

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // Handle user denying access
    if (error === 'access_denied') {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_denied&code=PINTEREST_001&provider=pinterest',
        },
      });
    }

    if (!code) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=invalid_request&code=PARAM_001&provider=pinterest',
        },
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetchWithTimeout(
      'https://api.pinterest.com/v5/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: keys().PINTEREST_CLIENT_ID,
          client_secret: keys().PINTEREST_CLIENT_SECRET,
          redirect_uri: keys().PINTEREST_CALLBACK_URL,
          code,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        'Pinterest token exchange failed:',
        await tokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=PINTEREST_002&provider=pinterest',
        },
      });
    }

    const tokenData = (await tokenResponse.json()) as PinterestTokenResponse;

    // Get user profile information
    const userResponse = await fetchWithTimeout(
      'https://api.pinterest.com/v5/user_account',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error('Pinterest user fetch failed:', await userResponse.text());
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_fetch_failed&code=PINTEREST_003&provider=pinterest',
        },
      });
    }

    const userObject = (await userResponse.json()) as PinterestUserResponse;

    // Check if this Pinterest account is already connected to a different user
    const existingProvider = await database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.profileId, userObject.username),
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
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          fullName: userObject.username,
          username: userObject.username,
          profileImage: userObject.profile_image,
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        })
        .where(eq(socialProviders.id, existingProvider[0].id));

      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?notification=account_transferred&platform=pinterest',
        },
      });
    }

    // Upsert the social provider using conflict resolution
    await database
      .insert(socialProviders)
      .values({
        userId,
        socialType: 'PINTEREST',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        profileId: userObject.username,
        username: userObject.username,
        fullName: userObject.username,
        profileImage: userObject.profile_image,
        expiresIn: new Date(Date.now() + 3600 * 1000),
        isActive: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [socialProviders.userId, socialProviders.profileId],
        set: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          fullName: userObject.username,
          username: userObject.username,
          profileImage: userObject.profile_image,
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

    // Successful connection
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/socials?success=true&provider=pinterest',
      },
    });
  } catch (error) {
    console.error('Pinterest callback error:', error);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location:
          '/socials?error=server_error&code=PINTEREST_500&provider=pinterest',
      },
    });
  }
}
