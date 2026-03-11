import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { DeluluApiClient } from "../api-client.js";

export function registerStatsTools(server: McpServer, client: DeluluApiClient) {
  server.tool(
    "get_usage",
    "Get current usage statistics (posts, accounts, storage)",
    {},
    async () => {
      const result = await client.getUsage();
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
    {},
    async () => {
      const result = await client.getSubscription();
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );
}
