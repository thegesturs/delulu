'use server';

import { auth } from '@clerk/nextjs/server';
import { api } from '@delulu/database/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

export async function getSocials() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not found');
  }
  const user = await fetchQuery(api.users.getUserByExternalId, {
    externalId: userId,
  });
  if (!user?._id) {
    throw new Error('User not found');
  }
  const media = await fetchQuery(api.media.getMediaByUserId, {
    userId: user._id,
  });
  return media;
}
