import { keys } from '@delulu/api/keys';
import { getAuth } from '@delulu/auth/server';
import { database } from '@delulu/database';
import { nanoid } from 'nanoid';
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

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=auth_required&code=AUTH_001&provider=pinterest',
        },
      });
    }

    const searchParams = req.nextUrl.searchParams;
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

    // Store the social provider data
    await database.socialProvider.upsert({
      where: {
        userId_profileId: {
          userId,
          profileId: userObject.username,
        },
      },
      create: {
        id: `social_${nanoid(12)}`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        fullName: userObject.username,
        username: userObject.username,
        profileImage: userObject.profile_image,
        profileId: userObject.username,
        userId,
        socialType: 'PINTEREST',
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        username: userObject.username,
        profileImage: userObject.profile_image,
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
        isActive: true,
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
