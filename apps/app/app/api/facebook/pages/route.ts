import { decryptData } from '@delulu/auth/encrypt';
import { auth } from '@delulu/auth/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      return new NextResponse(null, { status: 400 });
    }

    // Verify the key belongs to the current user
    if (!key.startsWith(`fb-pages-${session.user.id}-`)) {
      return new NextResponse(null, { status: 403 });
    }

    const { env } = await getCloudflareContext({
      async: true,
    });

    const encryptedData = await env.DELULU_FACEBOOK_PAGES.get(key);

    if (!encryptedData) {
      return new NextResponse(null, { status: 404 });
    }

    // Decrypt the data before returning
    const decryptedData = await decryptData(encryptedData);
    return NextResponse.json(JSON.parse(decryptedData));
  } catch (error) {
    console.error('Error fetching Facebook pages:', error);
    return new NextResponse(null, { status: 500 });
  }
}
