import { createApiClient, runEffect } from "@delulu/client";
import { CliError } from "./cli-error.js";
import {
  DEFAULT_API_URL,
  readCredentials,
  writeCredentials,
} from "./config.js";

interface RequestOptions {
  apiUrl?: string;
  json?: boolean;
  workspace?: string;
}

export function getContractClient(options: RequestOptions = {}) {
  return createApiClient({
    baseUrl: options.apiUrl || process.env.DELULU_API_URL || DEFAULT_API_URL,
    getToken: getAccessToken,
  });
}

/**
 * The workspace a workspace-bound token was minted for, read from its `wid`
 * claim. A bound token only works against this workspace, so it is the correct
 * default when the user has not overridden it.
 */
export async function boundWorkspaceId() {
  const credentials = await readCredentials();
  const payload = credentials?.accessToken.split(".")[1];
  if (!payload) {
    return undefined;
  }
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { wid?: string };
    return typeof claims.wid === "string" ? claims.wid : undefined;
  } catch {
    return undefined;
  }
}

export async function getWorkspaceId(options: RequestOptions = {}) {
  const selected =
    options.workspace ||
    process.env.DELULU_WORKSPACE_ID ||
    (await boundWorkspaceId());
  if (selected) {
    return selected;
  }
  const memberships = await runEffect(
    getContractClient(options).me.workspaces()
  );
  if (memberships.data.length > 1) {
    throw new CliError({
      code: "WORKSPACE_SELECTION_REQUIRED",
      message:
        "More than one eligible workspace is available; choose one explicitly",
      exitCode: 4,
      details: { eligible: memberships.data.length },
      next: ["delulu workspace", "delulu workspace use <selector>"],
    });
  }
  const only = memberships.data[0]?.workspaceId;
  if (!only) {
    throw new CliError({
      code: "WORKSPACE_NOT_AVAILABLE",
      message: "No eligible workspace is available for this account",
      exitCode: 4,
      next: ["delulu login"],
    });
  }
  return only;
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
