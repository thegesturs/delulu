/**
 * Generates the correct media URL based on environment
 * In development: Uses local API route
 * In production: Uses CDN domain
 */
export function getMediaUrl(
  bucketKey: string | undefined,
  fallbackUrl?: string
): string {
  // If no bucketKey, use fallback URL or empty string
  if (!bucketKey) {
    return fallbackUrl || "";
  }

  // Environment-aware URL generation
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    return `https://media.delulu.social/${bucketKey}`;
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
