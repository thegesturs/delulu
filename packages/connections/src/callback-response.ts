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

/** Build the canonical transfer prompt redirect for every provider adapter. */
export const transferRequiredRedirect = (input: {
  readonly platform: string;
  readonly connectionId: string;
  readonly sourceWorkspaceId: string;
}): Response => {
  const params = new URLSearchParams({
    notification: "transfer_required",
    platform: input.platform.toLowerCase(),
    connectionId: input.connectionId,
    sourceWorkspaceId: input.sourceWorkspaceId,
  });
  return callbackRedirect(`/socials?${params.toString()}`);
};

const mapCallbackRedirect = (
  response: Response,
  update: (url: URL) => boolean
): Response => {
  const location = response.headers.get("Location");
  if (!(location && response.status >= 300 && response.status < 400)) {
    return response;
  }

  const url = new URL(location);
  if (!update(url)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Location", url.toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const withConnectionReturnTarget = (
  response: Response,
  target?: "socials" | "onboarding-connect"
): Response => {
  if (!target || target === "socials") {
    return response;
  }
  return mapCallbackRedirect(response, (url) => {
    if (url.pathname !== "/socials") {
      return false;
    }
    url.pathname = "/onboarding";
    url.searchParams.set("step", "connect");
    return true;
  });
};

/** Preserve the signed initiating client on errors so retries keep context. */
export const withConnectionClient = (
  response: Response,
  client?: "cli" | "mcp"
): Response => {
  if (!client) {
    return response;
  }
  return mapCallbackRedirect(response, (url) => {
    if (url.pathname !== "/socials") {
      return false;
    }
    url.searchParams.set("client", client);
    return true;
  });
};

/**
 * Add provider/account details to a successful social callback without making
 * each provider adapter duplicate redirect construction. Error and transfer
 * redirects are deliberately left untouched.
 */
export const withConnectionSuccess = (
  response: Response,
  context: {
    readonly provider: string;
    readonly username: string;
    readonly client?: "cli" | "mcp";
  }
): Response => {
  return mapCallbackRedirect(response, (url) => {
    if (
      url.pathname !== "/socials" ||
      url.searchParams.has("error") ||
      url.searchParams.has("notification")
    ) {
      return false;
    }
    url.searchParams.set("success", "true");
    url.searchParams.set("provider", context.provider.toLowerCase());
    if (context.client) {
      url.searchParams.set("client", context.client);
    }
    url.hash = new URLSearchParams({ username: context.username }).toString();
    return true;
  });
};
