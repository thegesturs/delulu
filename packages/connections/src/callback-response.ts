const appBaseUrl = (): string =>
  process.env.APP_BASE_URL ?? "http://localhost:3000";

/** Redirect an OAuth callback response back to the browser application. */
export const callbackRedirect = (location: string): Response => {
  if (!location.startsWith("/") || location.startsWith("//")) {
    throw new TypeError("Callback redirect must be an app-relative path");
  }
  return new Response(null, {
    status: 302,
    headers: { Location: new URL(location, appBaseUrl()).toString() },
  });
};
