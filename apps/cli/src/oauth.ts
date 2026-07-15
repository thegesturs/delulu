import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { URL } from "node:url";
import { intro, outro } from "@clack/prompts";
import {
  DEFAULT_API_URL,
  OAUTH_SCOPES,
  REDIRECT_URI,
  writeCredentials,
} from "./config.js";
import { createCodeChallenge, createCodeVerifier } from "./pkce.js";

const TRAILING_SLASH = /\/$/;

interface OAuthMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  device_authorization_endpoint?: string;
  userinfo_endpoint?: string;
}

interface LoginOptions {
  clientId?: string;
  issuer?: string;
  loopback?: boolean;
}

const DEVICE_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:device_code";

function openBrowser(url: string) {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  spawn(command, args, { stdio: "ignore", detached: true }).unref();
}

function waitForCallback(state: string) {
  return new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url || "/", REDIRECT_URI);
      const code = requestUrl.searchParams.get("code");
      const returnedState = requestUrl.searchParams.get("state");
      const error = requestUrl.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end(`Delulu login failed: ${error}`);
        server.close();
        reject(new Error(error));
        return;
      }

      if (!code || returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Delulu login failed: invalid OAuth callback.");
        server.close();
        reject(new Error("Invalid OAuth callback"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Delulu login complete. You can close this tab.");
      server.close();
      resolve(code);
    });

    server.listen(32_123, "127.0.0.1");
  });
}

async function fetchMetadata(issuer: string) {
  const response = await fetch(
    `${issuer.replace(TRAILING_SLASH, "")}/.well-known/oauth-authorization-server`
  );
  if (!response.ok) {
    throw new Error(`Failed to load OAuth metadata: ${response.status}`);
  }
  return (await response.json()) as OAuthMetadata;
}

const resolveLoginConfig = (options: LoginOptions) => {
  const clientId =
    options.clientId || process.env.DELULU_OAUTH_CLIENT_ID || "delulu-cli";
  const issuer =
    options.issuer || process.env.DELULU_OAUTH_ISSUER || DEFAULT_API_URL;

  if (!clientId) {
    throw new Error(
      "Missing OAuth client id. Pass --client-id or set DELULU_OAUTH_CLIENT_ID."
    );
  }
  if (!issuer) {
    throw new Error(
      "Missing OAuth issuer. Pass --issuer or set DELULU_OAUTH_ISSUER."
    );
  }

  return { clientId, issuer };
};

const storeTokens = async (
  tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  },
  input: {
    issuer: string;
    clientId: string;
    metadata: OAuthMetadata;
  }
) => {
  await writeCredentials({
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: tokenData.expires_in
      ? Date.now() + tokenData.expires_in * 1000
      : undefined,
    issuer: input.issuer,
    clientId: input.clientId,
    tokenEndpoint: input.metadata.token_endpoint,
    authorizationEndpoint: input.metadata.authorization_endpoint,
    userinfoEndpoint: input.metadata.userinfo_endpoint,
  });
};

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function loginWithDevice(options: LoginOptions) {
  const { clientId, issuer } = resolveLoginConfig(options);
  intro("Delulu CLI login");
  const metadata = await fetchMetadata(issuer);
  if (!metadata.device_authorization_endpoint) {
    throw new Error(
      "This server does not advertise device authorization. Retry with --loopback."
    );
  }
  const response = await fetch(metadata.device_authorization_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      scope: OAUTH_SCOPES,
      resource: process.env.DELULU_API_URL || issuer,
    }),
  });
  if (!response.ok) {
    throw new Error(`Could not start device login: ${response.status}`);
  }
  const device = (await response.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete?: string;
    expires_in: number;
    interval: number;
  };
  const verificationUrl =
    device.verification_uri_complete || device.verification_uri;
  console.log(`Open ${verificationUrl}`);
  console.log(`Verification code: ${device.user_code}`);
  openBrowser(verificationUrl);

  const deadline = Date.now() + device.expires_in * 1000;
  let interval = Math.max(1, device.interval) * 1000;
  while (Date.now() < deadline) {
    await sleep(interval);
    const tokenResponse = await fetch(metadata.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: DEVICE_GRANT_TYPE,
        device_code: device.device_code,
        client_id: clientId,
      }),
    });
    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };
    if (tokenResponse.ok && tokenData.access_token) {
      await storeTokens(
        {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
        },
        { issuer, clientId, metadata }
      );
      outro("Logged in.");
      return;
    }
    if (tokenData.error === "authorization_pending") {
      continue;
    }
    if (tokenData.error === "slow_down") {
      interval += 5000;
      continue;
    }
    throw new Error(
      tokenData.error_description || tokenData.error || "Device login failed"
    );
  }
  throw new Error("Device login expired before authorization completed");
}

async function loginWithLoopback(options: LoginOptions) {
  const { clientId, issuer } = resolveLoginConfig(options);

  intro("Delulu CLI login");
  const metadata = await fetchMetadata(issuer);
  const verifier = createCodeVerifier();
  const challenge = createCodeChallenge(verifier);
  const state = createCodeVerifier();

  const authorizeUrl = new URL(metadata.authorization_endpoint);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authorizeUrl.searchParams.set("scope", OAUTH_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const callbackPromise = waitForCallback(state);
  openBrowser(authorizeUrl.toString());
  console.log(
    `Open this URL if your browser did not open:\n${authorizeUrl.toString()}`
  );

  const code = await callbackPromise;
  const tokenResponse = await fetch(metadata.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: clientId,
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${tokenResponse.status}`);
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  await storeTokens(tokenData, { issuer, clientId, metadata });

  outro("Logged in.");
}

export async function login(options: LoginOptions) {
  return options.loopback
    ? loginWithLoopback(options)
    : loginWithDevice(options);
}
