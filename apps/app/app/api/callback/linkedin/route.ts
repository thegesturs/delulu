import { env } from '@/env';
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

/**
 * Sanitizes and creates a safe username from first and last names
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return (
    text
      .toLowerCase()
      .trim()
      // Remove or replace special characters and spaces
      .replace(/[^a-z0-9]/g, '')
      // Remove consecutive spaces that became empty
      .replace(/\s+/g, '')
      // Limit length to prevent overly long usernames
      .substring(0, 20)
  );
}

/**
 * Generates a unique username from first and last names with fallback strategies
 */
async function generateUniqueUsername(
  firstName: string,
  lastName: string,
  linkedinId: string
): Promise<string> {
  // Validate and sanitize inputs
  const sanitizedFirst = sanitizeText(firstName);
  const sanitizedLast = sanitizeText(lastName);

  // Strategy 1: Use first.last format if both names are valid
  if (sanitizedFirst && sanitizedLast) {
    const baseUsername = `${sanitizedFirst}.${sanitizedLast}`;
    const uniqueUsername = await ensureUniqueUsername(baseUsername);
    if (uniqueUsername) return uniqueUsername;
  }

  // Strategy 2: Use just first name if available
  if (sanitizedFirst) {
    const baseUsername = sanitizedFirst;
    const uniqueUsername = await ensureUniqueUsername(baseUsername);
    if (uniqueUsername) return uniqueUsername;
  }

  // Strategy 3: Use just last name if available
  if (sanitizedLast) {
    const baseUsername = sanitizedLast;
    const uniqueUsername = await ensureUniqueUsername(baseUsername);
    if (uniqueUsername) return uniqueUsername;
  }

  // Strategy 4: Fallback to linkedin ID based username
  const fallbackUsername = `linkedin_${sanitizeText(linkedinId)}`;
  const uniqueUsername = await ensureUniqueUsername(fallbackUsername);
  if (uniqueUsername) return uniqueUsername;

  // Strategy 5: Last resort - generate random username
  return `user_${nanoid(8).toLowerCase()}`;
}

/**
 * Ensures username uniqueness by checking against existing usernames
 */
async function ensureUniqueUsername(
  baseUsername: string
): Promise<string | null> {
  if (!baseUsername || baseUsername.length < 2) return null;

  // Check if base username is available
  const existing = await database
    .select({ username: socialProviders.username })
    .from(socialProviders)
    .where(eq(socialProviders.username, baseUsername))
    .limit(1);

  if (existing.length === 0) {
    return baseUsername;
  }

  // Try with numeric suffixes
  for (let i = 1; i <= 99; i++) {
    const candidateUsername = `${baseUsername}${i}`;
    const existingWithSuffix = await database
      .select({ username: socialProviders.username })
      .from(socialProviders)
      .where(eq(socialProviders.username, candidateUsername))
      .limit(1);

    if (existingWithSuffix.length === 0) {
      return candidateUsername;
    }
  }

  // If all numeric suffixes are taken, append a random string
  return `${baseUsername}_${nanoid(4).toLowerCase()}`;
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

    // Generate a safe and unique username
    const username = await generateUniqueUsername(
      userObject.localizedFirstName,
      userObject.localizedLastName,
      userObject.id
    );

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

    // If found, handle the transfer using encrypted update
    if (existingProvider.length > 0) {
      await socialQueries.updateSocialProviderWithEncryption(
        existingProvider[0].id,
        {
          userId,
          accessToken: access_token,
          refreshToken: null, // LinkedIn doesn't provide refresh tokens
          expiresIn: new Date(Date.now() + expires_in * 1000),
          fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
          username: username,
          profileImage: profileImage,
          updatedAt: new Date(),
          isActive: true,
          refreshTokenExpiresIn: new Date(
            Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
          ),
          lastSyncedAt: new Date(),
        }
      );

      return NextResponse.redirect(
        new URL(
          '/socials?notification=account_transferred&platform=linkedin',
          env.NEXT_PUBLIC_APP_URL
        )
      );
    }

    // Upsert the social provider using conflict resolution with encryption
    await socialQueries.upsertSocialProviderWithEncryption(
      {
        userId,
        socialType: 'LINKEDIN',
        accessToken: access_token,
        refreshToken: null, // LinkedIn doesn't provide refresh tokens
        expiresIn: new Date(Date.now() + expires_in * 1000),
        profileId: userObject.id,
        username: username,
        fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
        profileImage: profileImage,
        isActive: true,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        refreshTokenExpiresIn: new Date(
          Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
        ),
      },
      {
        accessToken: access_token,
        refreshToken: null,
        expiresIn: new Date(Date.now() + expires_in * 1000),
        fullName: `${userObject.localizedFirstName} ${userObject.localizedLastName}`,
        username: username,
        profileImage: profileImage,
        updatedAt: new Date(),
        isActive: true,
        lastSyncedAt: new Date(),
        refreshTokenExpiresIn: new Date(
          Date.now() + 2 * 30 * 24 * 60 * 60 * 1000
        ),
      }
    );

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
