import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { DeluluApiClient } from "../api-client.js";

export function registerPostTools(server: McpServer, client: DeluluApiClient) {
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
    },
    async (params) => {
      const result = await client.listPosts(params);
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
    { id: z.string().describe("Post ID") },
    async (params) => {
      const result = await client.getPost(params.id);
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
                  mediaType: z.enum(["IMAGE", "VIDEO"]),
                  url: z.string().optional(),
                  bucketUrl: z.string().optional(),
                  bucketKey: z.string().optional(),
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
    },
    async (params) => {
      const result = await client.createPost(params);
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
                  mediaType: z.enum(["IMAGE", "VIDEO"]),
                  url: z.string().optional(),
                  bucketUrl: z.string().optional(),
                  bucketKey: z.string().optional(),
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
    },
    async (params) => {
      const { id, ...data } = params;
      const result = await client.updatePost(id, data);
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
    { id: z.string().describe("Post ID") },
    async (params) => {
      const result = await client.deletePost(params.id);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(result, null, 2) },
        ],
      };
    }
  );
}
