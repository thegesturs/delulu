import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { DeluluApiClient } from "../../../mcp/src/api-client";
import { registerAccountTools } from "../../../mcp/src/tools/accounts";
import { registerMediaTools } from "../../../mcp/src/tools/media";
import { registerPostTools } from "../../../mcp/src/tools/posts";
import { registerSetupTools } from "../../../mcp/src/tools/setup";
import { registerStatsTools } from "../../../mcp/src/tools/stats";

interface ToolExtra {
  authInfo?: {
    token?: string;
  };
}

const apiUrl = process.env.DELULU_API_URL || "https://api.delulu.social";

interface McpAuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  resource?: URL;
}

const validatedAuthInfo = async (
  bearerToken?: string
): Promise<McpAuthInfo | undefined> => {
  if (!bearerToken) {
    return undefined;
  }
  const response = await fetch(`${apiUrl}/oauth/introspect`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: bearerToken }),
  });
  if (!response.ok) {
    return undefined;
  }
  try {
    const payload = (await response.json()) as {
      active?: boolean;
      scopes?: readonly string[];
      aud?: string;
    };
    if (!payload.active) {
      return undefined;
    }
    return {
      token: bearerToken,
      clientId: "delulu-mcp",
      scopes: [...(payload.scopes ?? [])],
      resource: new URL(payload.aud ?? apiUrl),
    };
  } catch {
    return undefined;
  }
};

const mcpHandler = createMcpHandler(
  (server) => {
    const clientForRequest = (extra: unknown) => {
      const token = (extra as ToolExtra | undefined)?.authInfo?.token;
      if (!token) {
        throw new Error("Missing MCP OAuth token");
      }
      return new DeluluApiClient(apiUrl, token);
    };
    registerPostTools(server, clientForRequest);
    registerAccountTools(server, clientForRequest);
    registerStatsTools(server, clientForRequest);
    registerSetupTools(server, clientForRequest);
    registerMediaTools(server, clientForRequest);
  },
  {
    serverInfo: {
      name: "Delulu Social",
      version: "1.0.0",
    },
  },
  {
    basePath: "",
    disableSse: true,
  }
);

const handler = withMcpAuth(
  mcpHandler,
  async (_request, bearerToken) => validatedAuthInfo(bearerToken),
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
    resourceUrl: apiUrl,
  }
);

export { handler as DELETE, handler as GET, handler as POST };
