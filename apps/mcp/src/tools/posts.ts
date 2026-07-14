import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DeluluApiClient } from "../api-client.js";

type ClientSource = DeluluApiClient | ((extra: unknown) => DeluluApiClient);

function resolveClient(client: ClientSource, extra: unknown) {
  return typeof client === "function" ? client(extra) : client;
}

export function registerPostTools(server: McpServer, client: ClientSource) {
  server.tool(
    "list_posts",
    "List posts with optional status filter",
    {
      status: z
        .enum([
          "SAVED",
          "PUBLISHED",
          "SCHEDULED",
          "DELETED",
          "FAILED",
          "PROCESSING",
        ])
        .optional()
        .describe("Filter by post status"),
      limit: z
        .number()
        .optional()
        .describe("Number of posts to return (max 100)"),
      cursor: z.string().optional().describe("Pagination cursor"),
      workspaceId: z.string().optional().describe("Workspace ID"),
    },
    async (params, extra) => {
      const result = await resolveClient(client, extra).listPosts(params);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "get_post",
    "Get a single post by ID",
    {
      id: z.string().describe("Post ID"),
      workspaceId: z.string().optional().describe("Workspace ID"),
    },
    async (params, extra) => {
      const result = await resolveClient(client, extra).getPost(
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
    "create_post",
    "Create a new post",
    {
      content: z
        .array(
          z.object({
            order: z.number(),
            name: z.string(),
            text: z.string(),
            media: z
              .array(
                z.object({
                  id: z.string().describe("Completed workspace media ID"),
                })
              )
              .default([]),
            tags: z.array(z.string()).optional(),
          })
        )
        .describe("Post content slides"),
      socialProviderIds: z
        .array(z.string())
        .default([])
        .describe("IDs of social accounts to post to"),
      status: z
        .enum(["SAVED", "SCHEDULED"])
        .default("SAVED")
        .describe("Post status"),
      scheduledAt: z
        .number()
        .optional()
        .describe("Unix timestamp for scheduling"),
      privacyStatus: z
        .enum(["PUBLIC", "PRIVATE", "UNLISTED"])
        .optional()
        .describe("Privacy setting"),
      workspaceId: z.string().optional().describe("Workspace ID"),
      intent: z
        .enum(["draft", "schedule", "publish_now"])
        .default("draft")
        .describe("Explicit post delivery intent"),
    },
    async (params, extra) => {
      const resolved = resolveClient(client, extra);
      const created = await resolved.createPost({
        ...params,
        status: params.intent === "schedule" ? "SCHEDULED" : "SAVED",
      });
      const result =
        params.intent === "publish_now" && created.status !== "pending_review"
          ? await resolved.publishPostNow(created.id, params.workspaceId)
          : created;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "update_post",
    "Update an existing post",
    {
      id: z.string().describe("Post ID"),
      content: z
        .array(
          z.object({
            order: z.number(),
            name: z.string(),
            text: z.string(),
            media: z
              .array(
                z.object({
                  id: z.string().describe("Completed workspace media ID"),
                })
              )
              .default([]),
            tags: z.array(z.string()).optional(),
          })
        )
        .optional()
        .describe("Updated content"),
      status: z
        .enum(["SAVED", "SCHEDULED"])
        .optional()
        .describe("Updated status"),
      scheduledAt: z
        .number()
        .optional()
        .describe("Updated schedule time (Unix timestamp)"),
      workspaceId: z.string().optional().describe("Workspace ID"),
    },
    async (params, extra) => {
      const { id, ...data } = params;
      const result = await resolveClient(client, extra).updatePost(id, data);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );

  server.tool(
    "delete_post",
    "Delete a post (soft delete)",
    {
      id: z.string().describe("Post ID"),
      workspaceId: z.string().optional().describe("Workspace ID"),
    },
    async (params, extra) => {
      const result = await resolveClient(client, extra).deletePost(
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
    "publish_post_now",
    "Publish a prepared post immediately; live workspace roles and reviews apply",
    {
      id: z.string().describe("Post ID"),
      workspaceId: z.string().optional().describe("Workspace ID"),
    },
    async (params, extra) => {
      const result = await resolveClient(client, extra).publishPostNow(
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
}
