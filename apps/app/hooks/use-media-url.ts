"use client";

import { useEffect, useState } from "react";

const PRIVATE_HOST = "media.delulu.social";

/** Returns true for URLs that point at the old private CDN or the proxy route. */
function isLegacyUrl(url: string): boolean {
  if (url.startsWith("/api/media/")) {
    return true;
  }
  try {
    return new URL(url).host === PRIVATE_HOST;
  } catch {
    return false;
  }
}

/** Extract bucket key from a legacy URL. */
function keyFromUrl(url: string): string | undefined {
  if (url.startsWith("/api/media/")) {
    return url.slice("/api/media/".length);
  }
  try {
    const parsed = new URL(url);
    if (parsed.host === PRIVATE_HOST) {
      const path = parsed.pathname;
      return path.startsWith("/") ? path.slice(1) : path;
    }
  } catch {
    // not a valid URL
  }
  return undefined;
}

// Module-level cache so presigned URLs survive re-renders and are shared across components.
const presignedCache = new Map<string, string>();
// Track in-flight fetches so we don't duplicate requests.
const inflight = new Map<string, Promise<string>>();

async function fetchPresignedUrl(bucketKey: string): Promise<string> {
  const existing = inflight.get(bucketKey);
  if (existing) {
    return existing;
  }

  const promise = fetch(`/api/upload?key=${encodeURIComponent(bucketKey)}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to fetch presigned URL: ${res.status}`);
      }
      return res.json() as Promise<{ downloadUrl: string }>;
    })
    .then((data) => {
      presignedCache.set(bucketKey, data.downloadUrl);
      inflight.delete(bucketKey);
      return data.downloadUrl;
    })
    .catch((err) => {
      inflight.delete(bucketKey);
      throw err;
    });

  inflight.set(bucketKey, promise);
  return promise;
}

/**
 * Resolves a media object to a direct presigned R2 URL.
 *
 * - External / already-presigned URLs are returned immediately.
 * - Legacy `media.delulu.social` or `/api/media/` URLs are resolved via the
 *   `GET /api/upload?key=` endpoint and cached in-memory.
 * - Returns `""` while a presigned URL is being fetched.
 */
export function useMediaUrl(bucketKey?: string, url?: string): string {
  // Fast path: if url is already a direct presigned or external URL, return it.
  if (url && !isLegacyUrl(url)) {
    return url;
  }

  // Determine the key to look up.
  const key = bucketKey || (url ? keyFromUrl(url) : undefined);

  // Check cache synchronously.
  const cached = key ? presignedCache.get(key) : undefined;

  const [resolved, setResolved] = useState<string>(cached ?? "");

  useEffect(() => {
    if (!key) {
      return;
    }

    // Already cached — use it.
    const fromCache = presignedCache.get(key);
    if (fromCache) {
      setResolved(fromCache);
      return;
    }

    let cancelled = false;
    fetchPresignedUrl(key).then((presignedUrl) => {
      if (!cancelled) {
        setResolved(presignedUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return resolved;
}
