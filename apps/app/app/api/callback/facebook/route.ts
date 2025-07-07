import { fetchWithTimeout } from '@/lib/utils';
import { keys } from '@delulu/api/keys';
import { encryptData } from '@delulu/database/encrypt';
import { auth } from '@delulu/auth/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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
    picture: {
      data: {
        url: string;
        width: number;
        height: number;
        is_silhouette: boolean;
      };
    };
    cover: {
      id: string;
      source: string;
      offset_y: number;
    };
    link: string;
    followers_count: number;
    fan_count: number;
    verification_status: string;
  }>;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

async function getAllPages(
  accessToken: string
): Promise<FacebookPageResponse['data']> {
  let allPages: FacebookPageResponse['data'] = [];
  let nextUrl = `https://graph.facebook.com/v23.0/me/accounts?fields=access_token,category,category_list,name,id,tasks,picture{url,width,height,is_silhouette},cover,link,followers_count,fan_count,verification_status&access_token=${accessToken}`;

  while (nextUrl) {
    const response = await fetchWithTimeout(nextUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Facebook pages fetch failed:', await response.text());
      throw new Error('Failed to fetch Facebook pages');
    }

    const pagesData = (await response.json()) as FacebookPageResponse;
    allPages = [...allPages, ...pagesData.data];

    // Get the next page URL if it exists
    nextUrl = pagesData.paging?.next || '';
  }

  return allPages;
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

    // Get all user pages with pagination
    try {
      const allPages = await getAllPages(longLivedTokenData.access_token);

      if (!allPages || allPages.length === 0) {
        return new NextResponse(null, {
          status: 302,
          headers: {
            Location:
              '/socials?error=no_pages_found&code=FACEBOOK_005&provider=facebook',
          },
        });
      }

      // Store pages data with a stable key based on user ID and code
      const key = `fb-pages-${session.user.id}-${code}`;
      const { env } = await getCloudflareContext({
        async: true,
      });

      // Encrypt the pages data before storing
      const encryptedData = await encryptData(JSON.stringify(allPages));
      await env.DELULU_FACEBOOK_PAGES.put(key, encryptedData, {
        expirationTtl: 300, // 5 minutes in seconds
      });

      // Redirect to page selection UI with data key
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location: `/facebook-page-select?key=${key}&code=${code}`,
        },
      });
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location:
            '/socials?error=pages_fetch_failed&code=FACEBOOK_004&provider=facebook',
        },
      });
    }
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
