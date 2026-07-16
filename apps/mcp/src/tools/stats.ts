import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DeluluApiClient } from "../api-client.js";

type ClientSource = DeluluApiClient | ((extra: unknown) => DeluluApiClient);

function resolveClient(client: ClientSource, extra: unknown) {
  return typeof client === "function" ? client(extra) : client;
}

export function registerStatsTools(server: McpServer, client: ClientSource) {
  server.tool(
    "get_usage",
    "Get current usage statistics (posts, accounts, storage)",
    { workspaceId: z.string().optional().describe("Workspace ID") },
    async (params, extra) => {
      const result = await resolveClient(client, extra).getUsage(
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
    "get_subscription",
    "Get current subscription and plan info",
    { workspaceId: z.string().optional().describe("Workspace ID") },
    async (params, extra) => {
      const result = await resolveClient(client, extra).getSubscription(
        params.workspaceId
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );
}
