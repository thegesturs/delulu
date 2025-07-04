import { env } from '@/env';
import { fetchWithTimeout } from '@/lib/utils';
import { auth } from '@delulu/auth/server';
import {
  and,
  database,
  eq,
  ne,
  socialProviders,
  socialQueries,
} from '@delulu/database';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface ThreadsTokenResponse {
  access_token: string;
  user_id: string;
}

interface ThreadsLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ThreadsUser {
  id: string;
  username: string;
  name: string;
  threads_profile_picture_url: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=auth_required&code=AUTH_001&provider=threads',
        },
      });
    }

    const userId = session.user.id;

    const searchParams = request.nextUrl.searchParams;
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

    const userObject = (await userResponse.json()) as ThreadsUser;

    // Check if this Threads account is already connected to a different user
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

    // If found, handle the transfer using encrypted update
    if (existingProvider.length > 0) {
      await socialQueries.updateSocialProviderWithEncryption(
        existingProvider[0].id,
        {
          userId,
          accessToken: longLivedTokenData.access_token,
          expiresIn: new Date(
            Date.now() + longLivedTokenData.expires_in * 1000
          ),
          fullName: userObject.name,
          username: userObject.username,
          profileImage: userObject.threads_profile_picture_url,
          updatedAt: new Date(),
          isActive: true,
          refreshTokenExpiresIn: new Date(
            Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
          ),
          lastSyncedAt: new Date(),
        }
      );

      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?notification=account_transferred&platform=threads',
        },
      });
    }

    // Upsert the social provider using conflict resolution with encryption
    await socialQueries.upsertSocialProviderWithEncryption(
      {
        id: `social_${nanoid(12)}`,
        userId,
        socialType: 'THREADS',
        accessToken: longLivedTokenData.access_token,
        expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        profileId: userObject.id,
        username: userObject.username,
        fullName: userObject.name,
        profileImage: userObject.threads_profile_picture_url,
        isActive: true,
        lastSyncedAt: new Date(),
        refreshTokenExpiresIn: new Date(
          Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
        ),
      },
      {
        accessToken: longLivedTokenData.access_token,
        expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        fullName: userObject.name,
        username: userObject.username,
        profileImage: userObject.threads_profile_picture_url,
        isActive: true,
        lastSyncedAt: new Date(),
        refreshTokenExpiresIn: new Date(
          Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
        ),
      }
    );

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
