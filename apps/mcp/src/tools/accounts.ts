import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DeluluApiClient } from "../api-client.js";

export function registerAccountTools(
  server: McpServer,
  client: DeluluApiClient
) {
  server.tool(
    "list_accounts",
    "List connected social media accounts",
    {},
    async () => {
      const result = await client.listAccounts();
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
    { id: z.string().describe("Account ID") },
    async (params) => {
      const result = await client.getAccount(params.id);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );
}
