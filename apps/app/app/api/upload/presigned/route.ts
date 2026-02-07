import { randomUUID } from 'node:crypto';
import { R2Provider } from '@delulu/api/providers/r2.provider';
import { auth } from '@delulu/auth/server';
import { api } from '@delulu/database/convex/_generated/api';
import { fetchQuery } from '@delulu/database/server';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Generate presigned URL for direct client uploads to R2
 * This allows the client to upload directly to R2, bypassing the Next.js server
 * for much faster uploads (especially for large videos)
 */
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
    const body = await request.json();
    const { fileName, contentType, fileSize } = body as {
      fileName: string;
      contentType: string;
      fileSize: number;
    };

    if (!fileName || !contentType) {
      return new NextResponse('Missing fileName or contentType', {
        status: 400,
      });
    }

    // Validate file size (optional - adjust limits as needed)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    if (fileSize > MAX_FILE_SIZE) {
      return new NextResponse('File too large', { status: 413 });
    }

    const r2Provider = new R2Provider();

    // Generate unique key for R2
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${randomUUID()}.${fileExtension}`;
    const key = `${userId}/${uniqueFileName}`;

    console.log(
      `[DEBUG] Generating presigned URL for: ${fileName} (${contentType}), size: ${(fileSize / 1024 / 1024).toFixed(2)}MB, key: ${key}`
    );

    // Generate presigned URL
    const { uploadUrl } = await r2Provider.getPresignedUploadUrl(
      key,
      contentType,
      3600 // 1 hour expiration
    );

    console.log(`[DEBUG] Presigned URL generated for key: ${key}`);

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error('[ERROR] Failed to generate presigned URL:', error);
    return new NextResponse('Error generating presigned URL', { status: 500 });
  }
}
