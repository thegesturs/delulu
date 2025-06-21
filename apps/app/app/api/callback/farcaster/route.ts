import { keys } from '@delulu/api/keys';
import { getAuth } from '@delulu/auth/server';
import { database } from '@delulu/database';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

interface FarcasterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface FarcasterUserResponse {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
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
            '/socials?error=auth_required&code=AUTH_001&provider=farcaster',
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
            '/socials?error=user_denied&code=FARCASTER_001&provider=farcaster',
        },
      });
    }

    if (!code) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=invalid_request&code=PARAM_001&provider=farcaster',
        },
      });
    }

    // Exchange code for access token
    const tokenResponse = await fetchWithTimeout(
      'https://api.warpcast.com/v2/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: keys().FARCASTER_CLIENT_ID,
          redirect_uri: keys().FARCASTER_REDIRECT_URI,
          code,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        'Farcaster token exchange failed:',
        await tokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=FARCASTER_002&provider=farcaster',
        },
      });
    }

    const tokenData = (await tokenResponse.json()) as FarcasterTokenResponse;

    // Get user profile information
    const userResponse = await fetchWithTimeout(
      'https://api.warpcast.com/v2/me',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error('Farcaster user fetch failed:', await userResponse.text());
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_fetch_failed&code=FARCASTER_003&provider=farcaster',
        },
      });
    }

    const userObject = await userResponse.json() as { result: { user: FarcasterUserResponse } };

    // Store the social provider data using FID as profileId
    await database.socialProvider.upsert({
      where: {
        userId_profileId: {
          userId,
          profileId: userObject.result.user.fid.toString(),
        },
      },
      create: {
        id: `social_${nanoid(12)}`,
        accessToken: tokenData.access_token,
        expiresIn: new Date(Date.now() + tokenData.expires_in * 1000),
        fullName: userObject.result.user.display_name,
        username: userObject.result.user.username,
        profileImage: userObject.result.user.pfp_url,
        profileId: userObject.result.user.fid.toString(),
        userId,
        socialType: 'FARCASTER',
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken: tokenData.access_token,
        expiresIn: new Date(Date.now() + tokenData.expires_in * 1000),
        fullName: userObject.result.user.display_name,
        username: userObject.result.user.username,
        profileImage: userObject.result.user.pfp_url,
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
        isActive: true,
      },
    });

    // Successful connection
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/socials?success=true&provider=farcaster',
      },
    });
  } catch (error) {
    console.error('Farcaster callback error:', error);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location:
          '/socials?error=server_error&code=FARCASTER_500&provider=farcaster',
      },
    });
  }
}