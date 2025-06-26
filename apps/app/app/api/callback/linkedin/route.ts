import { env } from '@/env';
import { auth } from '@delulu/auth/server';
import { and, database, eq, ne, socialProviders } from '@delulu/database';
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL(
          '/socials?error=auth_required&code=AUTH_001&provider=LINKEDIN',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    const userId = session.user.id;

    if (!code) {
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

    // If found, handle the transfer
    if (existingProvider.length > 0) {
      await database
        .update(socialProviders)
        .set({
          userId,
          accessToken: access_token,
          refreshToken: null, // LinkedIn doesn't provide refresh tokens
          expiresIn: new Date(Date.now() + expires_in * 1000),
          fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
          username: email,
          profileImage: profileImage,
          updatedAt: new Date(),
          isActive: true,
          refreshTokenExpiresIn: new Date(
            Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
          ),
          lastSyncedAt: new Date(),
        })
        .where(eq(socialProviders.id, existingProvider[0].id));

      return NextResponse.redirect(
        new URL(
          '/socials?notification=account_transferred&platform=linkedin',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Upsert the social provider using conflict resolution
    await database
      .insert(socialProviders)
      .values({
        userId,
        socialType: 'LINKEDIN',
        accessToken: access_token,
        refreshToken: null, // LinkedIn doesn't provide refresh tokens
        expiresIn: new Date(Date.now() + expires_in * 1000),
        profileId: userObject.id,
        username: email || undefined,
        fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
        profileImage: profileImage,
        isActive: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokenExpiresIn: new Date(
          Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
        ),
      })
      .onConflictDoUpdate({
        target: [socialProviders.userId, socialProviders.profileId],
        set: {
          accessToken: access_token,
          refreshToken: null,
          expiresIn: new Date(Date.now() + expires_in * 1000),
          fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
          username: email,
          profileImage: profileImage,
          updatedAt: new Date(),
          isActive: true,
          lastSyncedAt: new Date(),
          refreshTokenExpiresIn: new Date(
            Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
          ),
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
