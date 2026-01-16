import { fetchWithTimeout } from '@/lib/utils';
import { verifyOAuthStateAndRecoverSession } from '@/lib/oauth-callback-helper';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { fetchMutation } from '@delulu/database/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface BlueskyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  refresh_token: string;
  did: string;
  handle: string;
}

interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export async function GET(request: NextRequest) {
	try {
		// Verify OAuth state and recover session
		const sessionResult = await verifyOAuthStateAndRecoverSession(
			request,
			'BLUESKY',
		);

		if (!sessionResult.success) {
			const { error, code: errorCode } = sessionResult.error;
			return new NextResponse(null, {
				status: 302,
				headers: {
					Location: `/socials?error=${error}&code=${errorCode}&provider=BLUESKY`,
				},
			});
		}

		const { userId, token, useInternalMutation, sessionRecovered } = sessionResult.data;

		if (sessionRecovered) {
			console.log('[BLUESKY] Session was recovered from state parameter');
		}

		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get('code');
		const error = searchParams.get('error');

    if (error === 'access_denied') {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_denied&code=BLUESKY_001&provider=bluesky',
        },
      });
    }

    if (!code) {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=invalid_request&code=PARAM_001&provider=bluesky',
        },
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetchWithTimeout(
      'https://bsky.social/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'https://delulu.social/api/callback/bluesky',
          client_id: 'https://delulu.social/oauth/bluesky-client.json',
          // code_verifier would be stored from the initial OAuth request
        }).toString(),
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        'Bluesky token exchange failed:',
        await tokenResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=token_invalid&code=BLUESKY_002&provider=bluesky',
        },
      });
    }

    const tokenData = (await tokenResponse.json()) as BlueskyTokenResponse;

    // Get user profile information
    const profileResponse = await fetchWithTimeout(
      `https://bsky.social/xrpc/com.atproto.repo.describeRepo?repo=${tokenData.did}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!profileResponse.ok) {
      console.error(
        'Bluesky profile fetch failed:',
        await profileResponse.text()
      );
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=user_fetch_failed&code=BLUESKY_003&provider=bluesky',
        },
      });
    }

    const profileData = (await profileResponse.json()) as BlueskyProfile;

    // Conditional mutation based on token availability
    let status;
    if (useInternalMutation) {
      status = await fetchMutation(
        api.social_providers.upsertSocialProviderFromOAuth,
        {
          userId: userId as Id<'users'>,
          socialType: 'BLUESKY',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: Date.now() + 24 * 60 * 60 * 1000,
          refreshTokenExpiresIn: Date.now() + 30 * 24 * 60 * 60 * 1000,
          profileId: tokenData.did,
          username: tokenData.handle,
          fullName: profileData.displayName || tokenData.handle,
          profileImage: profileData.avatar,
          isActive: true,
        }
      );
    } else {
      status = await fetchMutation(
        api.social_providers.upsertSocialProvider,
        {
          socialType: 'BLUESKY',
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresIn: Date.now() + 24 * 60 * 60 * 1000,
          refreshTokenExpiresIn: Date.now() + 30 * 24 * 60 * 60 * 1000,
          profileId: tokenData.did,
          username: tokenData.handle,
          fullName: profileData.displayName || tokenData.handle,
          profileImage: profileData.avatar,
          isActive: true,
        },
        { token: token! }
      );
    }

    // Handle different response statuses
    if (status === 'account_transferred') {
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?notification=account_transferred&platform=bluesky',
        },
      });
    }

    return new NextResponse(null, {
      status: 302,
      headers: {
        Location: '/socials?success=true&provider=bluesky',
      },
    });
  } catch (error) {
    console.error('Bluesky callback error:', error);
    return new NextResponse(null, {
      status: 302,
      headers: {
        Location:
          '/socials?error=server_error&code=BLUESKY_500&provider=bluesky',
      },
    });
  }
}
