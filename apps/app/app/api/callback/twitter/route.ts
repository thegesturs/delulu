import { env } from '@/env';
import { verifyOAuthStateAndRecoverSession } from '@/lib/oauth-callback-helper';
import { api } from '@delulu/database/convex/_generated/api';
import type { Id } from '@delulu/database/convex/_generated/dataModel';
import { fetchMutation } from '@delulu/database/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface TwitterResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface TwitterUserResponse {
  data: {
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

const TIMEOUT_MS = 8000; // 8 seconds timeout

// Helper function to handle fetch with timeout
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
    throw error;
  }
}

export async function GET(request: NextRequest) {
	try {
		// Verify OAuth state and recover session
		const sessionResult = await verifyOAuthStateAndRecoverSession(
			request,
			'TWITTER',
		);

		if (!sessionResult.success) {
			const { error, code: errorCode } = sessionResult.error;
			return NextResponse.redirect(
				new URL(
					`/socials?error=${error}&code=${errorCode}&provider=TWITTER`,
					env.NEXT_PUBLIC_APP_URL,
				),
			);
		}

		const { userId, token, useInternalMutation, sessionRecovered } = sessionResult.data;

		if (sessionRecovered) {
			console.log('[TWITTER] Session was recovered from state parameter');
		}

		const { searchParams } = new URL(request.url);
		const code = searchParams.get('code');

		if (!code) {
			return NextResponse.redirect(
				new URL(
					'/socials?error=missing_params&code=PARAM_001&provider=TWITTER',
					env.NEXT_PUBLIC_APP_URL,
				),
			);
		}

    const bearerToken = Buffer.from(
      `${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`
    ).toString('base64');

    // Get Twitter access token with timeout
    const tokenResponse = await fetchWithTimeout(
      'https://api.twitter.com/2/oauth2/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${bearerToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: env.TWITTER_CALLBACK_URL,
          code_verifier: 'challenge',
        }),
      }
    ).catch((error) => {
      console.error('Twitter token fetch error:', error);
      throw new Error('twitter_auth_failed');
    });

    if (!tokenResponse.ok) {
      throw new Error('twitter_token_invalid');
    }

    const response: TwitterResponse = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = response;

    // Get Twitter user data with timeout
    const userResponse = await fetchWithTimeout(
      'https://api.twitter.com/2/users/me?user.fields=username,profile_image_url,name,id',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('twitter_user_fetch_failed');
    }

    const { data: userObject } =
      (await userResponse.json()) as TwitterUserResponse;

    if (!userObject) {
      throw new Error('twitter_user_fetch_failed');
    }

    // Conditional mutation based on token availability
    let status;
    if (useInternalMutation) {
      status = await fetchMutation(
        api.social_providers.upsertSocialProviderFromOAuth,
        {
          userId: userId as Id<'users'>,
          socialType: 'TWITTER',
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: Date.now() + expires_in * 1000,
          profileId: userObject.id,
          username: userObject.username,
          fullName: userObject.name ?? '',
          profileImage: userObject.profile_image_url ?? '',
          isActive: true,
        }
      );
    } else {
      status = await fetchMutation(
        api.social_providers.upsertSocialProvider,
        {
          socialType: 'TWITTER',
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: Date.now() + expires_in * 1000,
          profileId: userObject.id,
          username: userObject.username,
          fullName: userObject.name ?? '',
          profileImage: userObject.profile_image_url ?? '',
          isActive: true,
        },
        { token: token! }
      );
    }

    // Handle different response statuses
    if (status === 'account_transferred') {
      return NextResponse.redirect(
        new URL(
          '/socials?notification=account_transferred&platform=twitter',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    return NextResponse.redirect(new URL('/socials', env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error('Twitter callback error:', error);
    const errorType = error instanceof Error ? error.message : 'internal_error';
    return NextResponse.redirect(
      new URL(
        `/socials?error=${errorType}&code=TWITTER_ERR&provider=TWITTER`,
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}

export const POST = GET;
export const PUT = GET;
