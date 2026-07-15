import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DeluluApiClient } from "../api-client.js";

type ClientSource = DeluluApiClient | ((extra: unknown) => DeluluApiClient);
const resolveClient = (client: ClientSource, extra: unknown) =>
  typeof client === "function" ? client(extra) : client;
const text = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
});

export function registerSetupTools(server: McpServer, client: ClientSource) {
  server.tool(
    "list_workspaces",
    "List available workspaces and live roles",
    {},
    async (_params, extra) =>
      text(await resolveClient(client, extra).listWorkspaces())
  );
  server.tool(
    "get_setup_status",
    "Get connection, payment, and onboarding status",
    { workspaceId: z.string().optional().describe("Workspace ID") },
    async (params, extra) =>
      text(
        await resolveClient(client, extra).getSetupStatus(params.workspaceId)
      )
  );
  server.tool(
    "create_checkout",
    "Create a hosted checkout URL for an eligible workspace payer",
    {
      workspaceId: z.string().optional().describe("Workspace ID"),
      plan: z.enum(["ECHO", "VIBE"]),
      interval: z.enum(["MONTHLY", "YEARLY"]),
      currency: z.enum(["USD", "INR"]),
    },
    async (params, extra) =>
      text(await resolveClient(client, extra).createCheckout(params))
  );
}
