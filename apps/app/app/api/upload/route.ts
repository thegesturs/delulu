import { randomUUID } from 'node:crypto';
import { r2Provider } from '@delulu/api/providers/r2.provider';
import { auth } from '@delulu/auth/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const userId = session?.session.userId;
  if (!userId) {
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
      return new NextResponse('Error generating upload URL', { status: 500 });
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
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const userId = session?.session.userId;
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return new NextResponse('No key provided', { status: 400 });
  }

  try {
    const downloadUrl = await r2Provider.getSignedDownloadUrl(key);
    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return new NextResponse('Error generating download URL', { status: 500 });
  }
}
