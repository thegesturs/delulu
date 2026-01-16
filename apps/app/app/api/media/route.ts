import { auth } from '@delulu/auth/server';
import { api } from '@delulu/database/convex/_generated/api';
import { fetchMutation, fetchQuery } from '@delulu/database/server';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateMediaSchema = z.object({
  bucketKey: z.string(),
  url: z.string(),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  originalFilename: z.string().optional(),
  size: z.number().optional(),
  extension: z.string().optional(),
  altText: z.string().optional(),
  bucketUrl: z.string().optional(),
  thumbnailBucketUrl: z.string().optional(),
  thumbnailBucketKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken({ template: 'convex' });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await fetchQuery(
      api.users.getUserByExternalId,
      {
        externalId: userId,
      },
      { token }
    );
    if (!user?._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateMediaSchema.parse(body);

    const mediaData = {
      ...parsed,
      userId: user._id,
      // You might want to add organizationId logic here if needed
    };

    const savedMedia = await fetchMutation(api.media.createMedia, mediaData);

    return NextResponse.json(savedMedia);
  } catch (error) {
    console.error('Error saving media:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save media' },
      { status: 500 }
    );
  }
}

// export async function GET(req: NextRequest) {
//   try {
//     const { userId, getToken } = await auth();

//     if (!userId) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const token = await getToken({ template: 'convex' });

//     if (!token) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const user = await fetchQuery(
//       api.users.getUserByExternalId,
//       {
//         externalId: userId,
//       },
//       { token }
//     );
//     if (!user?._id) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const limit = Number.parseInt(searchParams.get('limit') || '50');
//     const offset = Number.parseInt(searchParams.get('offset') || '0');
//     const mediaType = searchParams.get('mediaType') as 'IMAGE' | 'VIDEO' | null;

//     const media = await fetchQuery(
//       api.media.getMedia,
//       {
//         limit,
//         offset,
//         ...(mediaType && { mediaType }),
//       },
//       { token }
//     );

//     return NextResponse.json(media);
//   } catch (error) {
//     console.error('Error fetching media:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch media' },
//       { status: 500 }
//     );
//   }
// }
