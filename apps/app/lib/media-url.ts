/**
 * Generates the correct media URL
 * Always uses the authenticated API route which proxies to R2
 */
export function getMediaUrl(
  bucketKey: string | undefined,
  fallbackUrl?: string
): string {
  if (!bucketKey) {
    return fallbackUrl || '';
  }
  return `/api/media/${bucketKey}`;
}

/**
 * Generates media URL from media object
 * Prefers bucketKey over url for environment-aware serving
 */
export function getMediaUrlFromObject(media: {
  bucketKey?: string;
  url?: string;
}): string {
  return getMediaUrl(media.bucketKey, media.url);
}
