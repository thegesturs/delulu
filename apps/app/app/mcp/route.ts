import { verifyClerkToken } from "@clerk/mcp-tools/next";
import { auth } from "@delulu/auth/server";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { DeluluApiClient } from "../../../mcp/src/api-client";
import { registerDeluluTools } from "../../../mcp/src/server";

interface ToolExtra {
  authInfo?: {
    token?: string;
  };
}

const apiUrl = process.env.DELULU_API_URL || "https://api.delulu.social";

const mcpHandler = createMcpHandler(
  (server) => {
    registerDeluluTools(server, (extra) => {
      const token = (extra as ToolExtra | undefined)?.authInfo?.token;
      if (!token) {
        throw new Error("Missing MCP OAuth token");
      }
      return new DeluluApiClient(apiUrl, token);
    });
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
  async (_request, bearerToken) => {
    const authData = await auth({ acceptsToken: "oauth_token" });
    return verifyClerkToken(authData, bearerToken);
  },
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
  }
);

export { handler as DELETE, handler as GET, handler as POST };
