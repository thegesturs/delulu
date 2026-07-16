const DEFAULT_WEB_ORIGIN = "https://www.delulu.social";

/**
 * Returns the canonical public origin without a trailing slash or path.
 *
 * Normalizing here keeps canonicals, structured data, robots.txt, and the
 * sitemap aligned even when the deployment variable contains a trailing slash.
 */
export const getWebOrigin = (
  configuredUrl = process.env.NEXT_PUBLIC_WEB_URL
): string => {
  const url = new URL(configuredUrl || DEFAULT_WEB_ORIGIN);

  // The edge redirects the apex domain to www. Keep generated SEO signals on
  // the final URL even if a stale deployment variable still uses the apex.
  if (url.hostname === "delulu.social") {
    url.hostname = "www.delulu.social";
  }

  return url.origin;
};

export const getWebUrl = (
  pathname = "/",
  configuredUrl = process.env.NEXT_PUBLIC_WEB_URL
): string => new URL(pathname, `${getWebOrigin(configuredUrl)}/`).href;
