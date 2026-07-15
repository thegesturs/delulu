import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DeluluApiClient } from "../api-client.js";

type ClientSource = DeluluApiClient | ((extra: unknown) => DeluluApiClient);

function resolveClient(client: ClientSource, extra: unknown) {
  return typeof client === "function" ? client(extra) : client;
}

export function registerAccountTools(server: McpServer, client: ClientSource) {
  server.tool(
    "list_accounts",
    "List connected social media accounts",
    { workspaceId: z.string().optional().describe("Workspace ID") },
    async (params, extra) => {
      const result = await resolveClient(client, extra).listAccounts(
        params.workspaceId
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "get_account",
    "Get details of a connected social media account",
    {
      id: z.string().describe("Account ID"),
      workspaceId: z.string().optional().describe("Workspace ID"),
    },
    async (params, extra) => {
      const result = await resolveClient(client, extra).getAccount(
        params.id,
        params.workspaceId
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "connect_account",
    "Start a social account connection and return the provider authorization URL",
    {
      platform: z.string().describe("Supported social platform"),
      workspaceId: z.string().optional().describe("Workspace ID"),
      includeInsights: z.boolean().optional().default(true),
    },
    async (params, extra) => {
      const result = await resolveClient(client, extra).connectAccount(
        params.platform,
        {
          workspaceId: params.workspaceId,
          includeInsights: params.includeInsights,
        }
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );
}
