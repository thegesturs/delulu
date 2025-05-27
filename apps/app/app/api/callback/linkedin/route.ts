import { getAuth } from '@delulu/auth/server';
import { database } from '@delulu/database';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '@/env';

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInUserResponse {
  id: string;
  firstName: {
    localized: {
      en_US: string;
    };
  };
  lastName: {
    localized: {
      en_US: string;
    };
  };
  profilePicture?: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

function generateSocialProviderId(): string {
  return `sp_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
}

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Invalid request: Missing authorization code' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: env.LINKEDIN_CALLBACK_URL,
          client_id: env.LINKEDIN_CLIENT_ID,
          client_secret: env.LINKEDIN_CLIENT_SECRET,
        }),
      }
    );

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 500 }
      );
    }

    const tokenData: LinkedInTokenResponse = await tokenResponse.json();

    // Fetch user profile
    const userResponse = await fetch(
      'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'cache-control': 'no-cache',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    const userData: LinkedInUserResponse = await userResponse.json();

    const firstName = userData.firstName.localized.en_US;
    const lastName = userData.lastName.localized.en_US;
    const fullName = `${firstName} ${lastName}`;
    const profileImage =
      userData.profilePicture?.['displayImage~']?.elements[0]?.identifiers[0]
        ?.identifier ?? '';

    // Upsert the social provider
    await database.socialProvider.upsert({
      where: {
        userId_profileId: {
          userId,
          profileId: userData.id,
        },
      },
      create: {
        id: generateSocialProviderId(),
        accessToken: tokenData.access_token,
        expiresIn: new Date(Date.now() + tokenData.expires_in * 1000),
        fullName,
        profileImage,
        profileId: userData.id,
        userId,
        socialType: 'LINKEDIN',
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken: tokenData.access_token,
        expiresIn: new Date(Date.now() + tokenData.expires_in * 1000),
        fullName,
        profileImage,
        updatedAt: new Date(),
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL('/socials', env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process LinkedIn authentication' },
      { status: 500 }
    );
  }
}

export const POST = GET;
export const PUT = GET;
