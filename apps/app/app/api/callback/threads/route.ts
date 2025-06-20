import { env } from '@/env';
import { getAuth } from '@delulu/auth/server';
import { database } from '@delulu/database';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

interface ThreadsTokenResponse {
  access_token: string;
  user_id: string;
}

interface ThreadsLongLivedTokenResponse {
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

export async function GET(req: NextRequest) {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=auth_required&code=AUTH_001&provider=threads',
        },
      });
    }

    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');

    if (error === 'access_denied' && errorReason === 'user_denied') {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_denied&code=THREADS_001&provider=threads',
        },
      });
    }

    if (!code) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=invalid_request&code=PARAM_001&provider=threads',
        },
      });
    }

    const tokenResponse = await fetchWithTimeout(
      'https://graph.threads.net/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: env.THREADS_CLIENT_ID,
          client_secret: env.THREADS_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: env.THREADS_CALLBACK_URL,
          code,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        'Threads token exchange failed:',
        await tokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=THREADS_002&provider=threads',
        },
      });
    }

    const tokenData = (await tokenResponse.json()) as ThreadsTokenResponse;

    const longLivedTokenResponse = await fetchWithTimeout(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${
        env.THREADS_CLIENT_SECRET
      }&access_token=${tokenData.access_token}`,
      {
        method: 'GET',
      }
    );

    if (!longLivedTokenResponse.ok) {
      console.error(
        'Threads long-lived token exchange failed:',
        await longLivedTokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=THREADS_003&provider=threads',
        },
      });
    }

    const longLivedTokenData =
      (await longLivedTokenResponse.json()) as ThreadsLongLivedTokenResponse;

    const userResponse = await fetchWithTimeout(
      `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${longLivedTokenData.access_token}`,
      {
        method: 'GET',
      }
    );

    if (!userResponse.ok) {
      console.error('Threads user fetch failed:', await userResponse.text());
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_fetch_failed&code=THREADS_004&provider=threads',
        },
      });
    }

    const userObject = await userResponse.json();

    await database.socialProvider.upsert({
      where: {
        userId_profileId: {
          userId,
          profileId: userObject.id,
        },
      },
      create: {
        id: `social_${nanoid(12)}`,
        accessToken: longLivedTokenData.access_token,
        expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        fullName: userObject.name,
        username: userObject.username,
        profileImage: userObject.threads_profile_picture_url,
        profileId: userObject.id,
        userId,
        socialType: 'THREADS',
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken: longLivedTokenData.access_token,
        expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        username: userObject.username,
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
        isActive: true,
      },
    });

    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/socials?success=true&provider=threads',
      },
    });
  } catch (error) {
    console.error('Threads callback error:', error);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location:
          '/socials?error=server_error&code=THREADS_500&provider=threads',
      },
    });
  }
}
