import { env } from '@/env';
import { getAuth } from '@delulu/auth/server';
import { database } from '@delulu/database';
import { nanoid } from 'nanoid';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

interface LinkedInResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInUserResponse {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
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

interface LinkedInEmailResponse {
  elements: Array<{
    'handle~': {
      emailAddress: string;
    };
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!userId) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=auth_required&code=AUTH_001&provider=LINKEDIN',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    if (!state || !code) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=invalid_request&code=PARAM_001&provider=LINKEDIN',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Get LinkedIn access token
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
    ).catch((error) => {
      console.error('LinkedIn token fetch error:', error);
      throw new Error('linkedin_auth_failed');
    });

    if (!tokenResponse.ok) {
      throw new Error('linkedin_token_invalid');
    }

    const { access_token, expires_in } =
      (await tokenResponse.json()) as LinkedInResponse;

    // Get LinkedIn user profile
    const userResponse = await fetch(
      'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202304',
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error('linkedin_user_fetch_failed');
    }

    const userObject = (await userResponse.json()) as LinkedInUserResponse;

    // Get LinkedIn email
    const emailResponse = await fetch(
      'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202304',
        },
      }
    );

    if (!emailResponse.ok) {
      throw new Error('linkedin_email_fetch_failed');
    }

    const emailData = (await emailResponse.json()) as LinkedInEmailResponse;
    const email = emailData.elements[0]?.['handle~']?.emailAddress;

    // Get profile image URL from the complex response structure
    const profileImage =
      userObject.profilePicture?.['displayImage~']?.elements[0]?.identifiers[0]
        ?.identifier;

    // Check if this LinkedIn account is already connected to a different user
    const existingProvider = await database.socialProvider.findFirst({
      where: {
        profileId: userObject.id,
        NOT: {
          userId: userId,
        },
      },
    });

    // If found, handle the transfer
    if (existingProvider) {
      await database.socialProvider.update({
        where: {
          id: existingProvider.id,
        },
        data: {
          userId,
          accessToken: access_token,
          refreshToken: null, // LinkedIn doesn't provide refresh tokens
          expiresIn: new Date(Date.now() + expires_in * 1000),
          fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
          username: email || undefined,
          profileImage: profileImage ?? undefined,
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
        },
      });

      return NextResponse.redirect(
        new URL(
          '/socials?notification=account_transferred&platform=linkedin',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Use upsert to either create or update the social provider
    await database.socialProvider.upsert({
      where: {
        userId_profileId: {
          userId,
          profileId: userObject.id,
        },
      },
      create: {
        id: `social_${nanoid(12)}`,
        accessToken: access_token,
        refreshToken: null, // LinkedIn doesn't provide refresh tokens
        expiresIn: new Date(Date.now() + expires_in * 1000),
        fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
        username: email || undefined,
        profileImage: profileImage ?? undefined,
        profileId: userObject.id,
        userId,
        socialType: 'LINKEDIN',
        isActive: true,
        lastSyncedAt: new Date(),
      },
      update: {
        accessToken: access_token,
        refreshToken: null,
        expiresIn: new Date(Date.now() + expires_in * 1000),
        fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
        username: email || undefined,
        profileImage: profileImage || undefined,
        updatedAt: new Date(),
        isActive: true,
        lastSyncedAt: new Date(),
        userId,
      },
    });

    return NextResponse.redirect(new URL('/socials', env.NEXT_PUBLIC_APP_URL));
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    const errorType = error instanceof Error ? error.message : 'internal_error';
    return NextResponse.redirect(
      new URL(
        `/socials?error=${errorType}&code=LINKEDIN_ERR&provider=LINKEDIN`,
        env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}

export const POST = GET;
export const PUT = GET;
