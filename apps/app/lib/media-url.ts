/**
 * Generates the correct media URL based on environment
 * In development: Uses local API route
 * In production: Uses CDN domain
 */
export function getMediaUrl(
  bucketKey: string | undefined,
  fallbackUrl?: string
): string {
  return `https://media.delulu.social/${bucketKey}`;
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
