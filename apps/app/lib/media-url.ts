const PRIVATE_HOST = "media.delulu.social";

/** Extract bucket key from a media.delulu.social URL. */
function keyFromPrivateUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.host !== PRIVATE_HOST) {
      return undefined;
    }
    const path = parsed.pathname;
    return path.startsWith("/") ? path.slice(1) : path;
  } catch {
    return undefined;
  }
}

/**
 * Generates the correct media URL by proxying through the authenticated
 * API route which streams from R2. The R2 bucket is private so direct
 * media.delulu.social URLs return 401.
 */
export function getMediaUrl(
  bucketKey: string | undefined,
  fallbackUrl?: string
): string {
  if (bucketKey) {
    return `/api/media/${bucketKey}`;
  }
  // Derive key from private URL if bucketKey is missing
  if (fallbackUrl) {
    const derivedKey = keyFromPrivateUrl(fallbackUrl);
    if (derivedKey) {
      return `/api/media/${derivedKey}`;
    }
    return fallbackUrl;
  }
  return "";
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
