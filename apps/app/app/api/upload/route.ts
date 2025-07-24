import { randomUUID } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { R2Provider } from '@delulu/api/providers/r2.provider';
import { api } from '@delulu/database/convex/_generated/api';
import { fetchQuery } from '@delulu/database/server';
import { getCloudflareEnv } from '@delulu/cloudflare-types';
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

    // Initialize R2Provider with the bucket from environment
    const env = await getCloudflareEnv();
    const r2Provider = new R2Provider(env.DELULU_SOCIAL_BUCKET);

    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const key = `${userId}/${uniqueFileName}`;

    // Convert File to ArrayBuffer for R2
    const arrayBuffer = await file.arrayBuffer();

    // Upload directly to R2
    const uploadResult = await r2Provider.uploadFile(key, arrayBuffer, file.type);

    if (uploadResult.isErr()) {
      return new NextResponse(
        `Error uploading file: ${uploadResult.error.message}`,
        { status: 500 }
      );
    }

    const result = uploadResult.value;
    return NextResponse.json({
      success: result.success,
      key: result.key,
      downloadUrl: result.downloadUrl,
    });
  } catch {
    return new NextResponse('Error uploading file', { status: 500 });
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
    const r2Provider = new R2Provider();
    const downloadUrl = await r2Provider.getSignedDownloadUrl(key);

    if (downloadUrl.isErr()) {
      return new NextResponse(
        `Error generating download URL: ${downloadUrl.error.message}`,
        { status: 500 }
      );
    }
    return NextResponse.json({ downloadUrl: downloadUrl.value });
  } catch {
    return new NextResponse('Error generating download URL', { status: 500 });
  }
}
