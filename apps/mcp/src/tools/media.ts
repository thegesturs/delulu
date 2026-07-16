import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DeluluApiClient } from "../api-client.js";

type ClientSource = DeluluApiClient | ((extra: unknown) => DeluluApiClient);
const resolveClient = (client: ClientSource, extra: unknown) =>
  typeof client === "function" ? client(extra) : client;

export function registerMediaTools(server: McpServer, client: ClientSource) {
  server.tool(
    "import_media",
    "Import an image or video from a public HTTPS or public Google Drive URL",
    {
      workspaceId: z.string().optional().describe("Workspace ID"),
      url: z.string().url(),
      filename: z.string().optional(),
      altText: z.string().optional(),
      idempotencyKey: z.string().optional(),
    },
    async (params, extra) => {
      const result = await resolveClient(client, extra).importMedia(params);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );
}
