import { keys } from '@delulu/api/keys';
import { auth } from '@delulu/auth/server';
import { database, socialProviders, eq, and, ne } from '@delulu/database';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookPageResponse {
  data: Array<{
    access_token: string;
    category: string;
    category_list: Array<{
      id: string;
      name: string;
    }>;
    name: string;
    id: string;
    tasks: string[];
  }>;
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
            '/socials?error=auth_required&code=AUTH_001&provider=facebook',
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
            '/socials?error=user_denied&code=FACEBOOK_001&provider=facebook',
        },
      });
    }

    if (!code) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=invalid_request&code=PARAM_001&provider=facebook',
        },
      });
    }

    // Exchange code for access token
    const tokenUrl = new URL(
      'https://graph.facebook.com/v23.0/oauth/access_token'
    );
    tokenUrl.searchParams.append('client_id', keys().FACEBOOK_CLIENT_ID);
    tokenUrl.searchParams.append('redirect_uri', keys().FACEBOOK_CALLBACK_URL);
    tokenUrl.searchParams.append(
      'client_secret',
      keys().FACEBOOK_CLIENT_SECRET
    );
    tokenUrl.searchParams.append('code', code);

    const tokenRequest = await fetchWithTimeout(tokenUrl.toString(), {
      method: 'GET',
    });

    if (!tokenRequest.ok) {
      console.error(
        'Facebook token exchange failed:',
        await tokenRequest.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=FACEBOOK_002&provider=facebook',
        },
      });
    }

    const tokenData = (await tokenRequest.json()) as FacebookTokenResponse;

    // Exchange short-lived token for long-lived token
    const longLivedTokenUrl = new URL(
      'https://graph.facebook.com/v23.0/oauth/access_token'
    );
    longLivedTokenUrl.searchParams.append('grant_type', 'fb_exchange_token');
    longLivedTokenUrl.searchParams.append(
      'client_id',
      keys().FACEBOOK_CLIENT_ID
    );
    longLivedTokenUrl.searchParams.append(
      'client_secret',
      keys().FACEBOOK_CLIENT_SECRET
    );
    longLivedTokenUrl.searchParams.append(
      'fb_exchange_token',
      tokenData.access_token
    );

    const longLivedTokenResponse = await fetchWithTimeout(
      longLivedTokenUrl.toString(),
      {
        method: 'GET',
      }
    );

    if (!longLivedTokenResponse.ok) {
      console.error(
        'Facebook long-lived token exchange failed:',
        await longLivedTokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=FACEBOOK_003&provider=facebook',
        },
      });
    }

    const longLivedTokenData =
      (await longLivedTokenResponse.json()) as FacebookLongLivedTokenResponse;

    // Get user pages
    const pagesResponse = await fetchWithTimeout(
      `https://graph.facebook.com/v23.0/me/accounts?access_token=${longLivedTokenData.access_token}`,
      {
        method: 'GET',
      }
    );

    if (!pagesResponse.ok) {
      console.error('Facebook pages fetch failed:', await pagesResponse.text());
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=pages_fetch_failed&code=FACEBOOK_004&provider=facebook',
        },
      });
    }

    const pagesData = (await pagesResponse.json()) as FacebookPageResponse;

    if (!pagesData.data || pagesData.data.length === 0) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=no_pages_found&code=FACEBOOK_005&provider=facebook',
        },
      });
    }

    // Use the first page (you might want to let users choose)
    const firstPage = pagesData.data[0];

    // Check if this Facebook account is already connected to a different user
    const existingProvider = await database
      .select()
      .from(socialProviders)
      .where(
        and(
          eq(socialProviders.profileId, firstPage.id),
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
          accessToken: firstPage.access_token,
          expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
          fullName: firstPage.name,
          username: firstPage.name,
          profileImage: `https://graph.facebook.com/${firstPage.id}/picture?type=large`,
          refreshTokenExpiresIn: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        })
        .where(eq(socialProviders.id, existingProvider[0].id));

      return new NextResponse(null, {
        status: 302,
        headers: {
          Location: '/socials?notification=account_transferred&platform=facebook',
        },
      });
    }

    // Upsert the social provider using conflict resolution
    await database
      .insert(socialProviders)
      .values({
        id: `social_${nanoid(12)}`,
        userId,
        socialType: 'FACEBOOK',
        accessToken: firstPage.access_token,
        expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
        profileId: firstPage.id,
        username: firstPage.name,
        fullName: firstPage.name,
        profileImage: `https://graph.facebook.com/${firstPage.id}/picture?type=large`,
        isActive: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [socialProviders.userId, socialProviders.profileId],
        set: {
          accessToken: firstPage.access_token,
          expiresIn: new Date(Date.now() + longLivedTokenData.expires_in * 1000),
          fullName: firstPage.name,
          username: firstPage.name,
          profileImage: `https://graph.facebook.com/${firstPage.id}/picture?type=large`,
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

    // Successful connection
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/socials?success=true&provider=facebook',
      },
    });
  } catch (error) {
    console.error('Facebook callback error:', error);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location:
          '/socials?error=server_error&code=FACEBOOK_500&provider=facebook',
      },
    });
  }
}
