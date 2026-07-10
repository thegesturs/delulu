import {
  DEFAULT_API_URL,
  readCredentials,
  writeCredentials,
} from "./config.js";

const TRAILING_SLASH = /\/$/;

interface RequestOptions {
  apiUrl?: string;
  json?: boolean;
}

async function refreshCredentials(
  credentials: NonNullable<Awaited<ReturnType<typeof readCredentials>>>
) {
  if (!credentials.refreshToken) {
    return credentials;
  }

  if (credentials.expiresAt && credentials.expiresAt - Date.now() > 60_000) {
    return credentials;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: credentials.refreshToken,
    client_id: credentials.clientId,
  });

  const response = await fetch(credentials.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const next = {
    ...credentials,
    accessToken: data.access_token,
    refreshToken: data.refresh_token || credentials.refreshToken,
    expiresAt: data.expires_in
      ? Date.now() + data.expires_in * 1000
      : undefined,
  };
  await writeCredentials(next);
  return next;
}

export async function getAccessToken() {
  const credentials = await readCredentials();
  if (!credentials) {
    throw new Error("Not logged in. Run `delulu login` first.");
  }
  return (await refreshCredentials(credentials)).accessToken;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
) {
  const token = await getAccessToken();
  const baseUrl = (
    options.apiUrl ||
    process.env.DELULU_API_URL ||
    DEFAULT_API_URL
  ).replace(TRAILING_SLASH, "");
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error?.message || response.statusText;
    throw new Error(`API error ${response.status}: ${message}`);
  }

  return data as T;
}

export function printResult(value: unknown, json = false) {
  if (json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }
  console.log(JSON.stringify(value, null, 2));
}
