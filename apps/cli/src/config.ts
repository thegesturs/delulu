import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export const DEFAULT_API_URL = "https://api.delulu.social";
export const REDIRECT_URI = "http://127.0.0.1:32123/callback";
export const OAUTH_SCOPES =
  "posts:read posts:write accounts:read accounts:write stats:read media:write billing:write";

export interface Credentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  issuer: string;
  clientId: string;
  tokenEndpoint: string;
  authorizationEndpoint: string;
  userinfoEndpoint?: string;
}

export function credentialsPath() {
  return join(homedir(), ".config", "delulu", "credentials.json");
}

export async function readCredentials() {
  try {
    const raw = await readFile(credentialsPath(), "utf8");
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export async function writeCredentials(credentials: Credentials) {
  const path = credentialsPath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(credentials, null, 2)}\n`, {
    mode: 0o600,
  });
  await chmod(path, 0o600);
}

export async function deleteCredentials() {
  await rm(credentialsPath(), { force: true });
}
