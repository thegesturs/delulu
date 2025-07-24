import { randomUUID } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { r2Provider } from '@delulu/api/providers/r2.provider';
import { api } from '@delulu/database/convex/_generated/api';
import { fetchQuery } from '@delulu/database/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const token = await getToken({ template: 'convex' });

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await fetchQuery(
    api.users.getUserByExternalId,
    { externalId: userId },
    { token }
  );

  if (!user?._id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const key = `${userId}/${uniqueFileName}`;

    const data = await r2Provider.getSignedUploadUrl(key, file.type);

    if (data.isErr()) {
      console.error('R2 upload URL generation error:', data.error);
      return new NextResponse(
        `Error generating upload URL: ${data.error.message}`,
        { status: 500 }
      );
    }

    const { uploadUrl, key: bucketKey } = data.value;

    return NextResponse.json({
      uploadUrl,
      bucketKey,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return new NextResponse('Error generating upload URL', { status: 500 });
  }
}

// Add a new route to get download URLs
export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const token = await getToken({ template: 'convex' });

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await fetchQuery(
    api.users.getUserByExternalId,
    { externalId: userId },
    { token }
  );
  if (!user?._id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return new NextResponse('No key provided', { status: 400 });
  }

  try {
    const downloadUrl = await r2Provider.getSignedDownloadUrl(key);

    if (downloadUrl.isErr()) {
      console.error('R2 download URL generation error:', downloadUrl.error);
      return new NextResponse(
        `Error generating download URL: ${downloadUrl.error.message}`,
        { status: 500 }
      );
    }
    return NextResponse.json({ downloadUrl: downloadUrl.value });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return new NextResponse('Error generating download URL', { status: 500 });
  }
}
