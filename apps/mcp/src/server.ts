import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DeluluApiClient } from "./api-client.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerPostTools } from "./tools/posts.js";
import { registerStatsTools } from "./tools/stats.js";

export function createServer(apiUrl: string, apiKey: string) {
  const server = new McpServer({
    name: "Delulu Social",
    version: "1.0.0",
  });

  const client = new DeluluApiClient(apiUrl, apiKey);
  registerDeluluTools(server, client);

  return server;
}

export function registerDeluluTools(
  server: McpServer,
  client: DeluluApiClient | ((extra: unknown) => DeluluApiClient)
) {
  registerPostTools(server, client);
  registerAccountTools(server, client);
  registerStatsTools(server, client);
}
