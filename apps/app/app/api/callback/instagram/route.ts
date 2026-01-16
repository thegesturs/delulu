import { env } from '@/env';
import { fetchWithTimeout } from '@/lib/utils';
import { verifyOAuthStateAndRecoverSession } from '@/lib/oauth-callback-helper';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { fetchMutation } from '@delulu/database/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface InstagramTokenResponse {
  access_token: string;
  user_id: string;
}

interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface InstagramUserResponse {
  id: string;
  name: string;
  username: string;
  account_type: string;
  profile_picture_url: string;
}

export async function GET(request: NextRequest) {
	try {
		// Verify OAuth state and recover session
		const sessionResult = await verifyOAuthStateAndRecoverSession(
			request,
			'INSTAGRAM',
		);

		if (!sessionResult.success) {
			const { error, code: errorCode } = sessionResult.error;
			return new NextResponse(null, {
				status: 302,
				headers: {
					Location: `/socials?error=${error}&code=${errorCode}&provider=INSTAGRAM`,
				},
			});
		}

		const { userId, token, useInternalMutation, sessionRecovered } = sessionResult.data;

		if (sessionRecovered) {
			console.log('[INSTAGRAM] Session was recovered from state parameter');
		}

		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get('code');
		const error = searchParams.get('error');
		const errorReason = searchParams.get('error_reason');

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
          client_id: env.INSTAGRAM_CLIENT_ID,
          client_secret: env.INSTAGRAM_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: env.INSTAGRAM_CALLBACK_URL,
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
        env.INSTAGRAM_CLIENT_SECRET
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

    const userObject = (await userResponse.json()) as InstagramUserResponse;

    // Conditional mutation based on token availability
    let status;
    if (useInternalMutation) {
      status = await fetchMutation(
        api.social_providers.upsertSocialProviderFromOAuth,
        {
          userId: userId as Id<'users'>,
          socialType: 'INSTAGRAM',
          accessToken: longLivedTokenData.access_token,
          expiresIn: Date.now() + longLivedTokenData.expires_in * 1000,
          refreshTokenExpiresIn: Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
          profileId: userObject.id,
          username: userObject.username,
          fullName: userObject.name,
          profileImage: userObject.profile_picture_url,
          isActive: true,
        }
      );
    } else {
      status = await fetchMutation(
        api.social_providers.upsertSocialProvider,
        {
          socialType: 'INSTAGRAM',
          accessToken: longLivedTokenData.access_token,
          expiresIn: Date.now() + longLivedTokenData.expires_in * 1000,
          refreshTokenExpiresIn: Date.now() + 2 * 30 * 24 * 60 * 60 * 1000,
          profileId: userObject.id,
          username: userObject.username,
          fullName: userObject.name,
          profileImage: userObject.profile_picture_url,
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
            '/socials?notification=account_transferred&platform=instagram',
        },
      });
    }

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
