const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
});

const postStatuses = [
  "SAVED",
  "PUBLISHED",
  "SCHEDULED",
  "DELETED",
  "FAILED",
  "PROCESSING",
] as const;

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Delulu Social API",
    version: "1.0.0",
    description: `The Delulu Social REST API lets you manage posts, social accounts, media, and usage stats programmatically.

## Authentication

All \`/v1\` endpoints require a Bearer token passed via the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Scopes

API keys are scoped to limit access. Available scopes:

| Scope | Description |
|-------|-------------|
| \`posts:read\` | List and retrieve posts |
| \`posts:write\` | Create, update, and delete posts |
| \`accounts:read\` | List and retrieve connected social accounts |
| \`stats:read\` | View usage and subscription stats |
| \`media:write\` | Upload media and create media records |

## Rate Limits

Rate limits depend on your plan:

| Plan | Per Minute | Per Day |
|------|-----------|---------|
| FREE | 20 | 500 |
| ECHO | 60 | 5,000 |
| VIBE | 120 | 20,000 |

Rate limit info is returned in response headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`.
`,
  },
  servers: [{ url: "https://api.delulu.social" }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description: "API key from your Delulu Social dashboard",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: {
                type: "string",
                examples: [
                  "NOT_FOUND",
                  "UNAUTHORIZED",
                  "FORBIDDEN",
                  "BAD_REQUEST",
                  "RATE_LIMIT_EXCEEDED",
                  "INTERNAL_ERROR",
                ],
              },
              message: { type: "string" },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
      Pagination: {
        type: "object",
        properties: {
          cursor: { type: ["string", "null"] },
          hasMore: { type: "boolean" },
        },
        required: ["cursor", "hasMore"],
      },
      Account: {
        type: "object",
        properties: {
          id: { type: "string" },
          socialType: {
            type: "string",
            examples: ["twitter", "instagram", "linkedin", "tiktok"],
          },
          profileId: { type: "string" },
          username: { type: "string" },
          fullName: { type: "string" },
          profileImage: { type: "string", format: "uri" },
          isActive: { type: "boolean" },
          lastSyncedAt: { type: "number" },
          createdAt: { type: "number" },
        },
        required: [
          "id",
          "socialType",
          "profileId",
          "username",
          "fullName",
          "profileImage",
          "isActive",
          "lastSyncedAt",
          "createdAt",
        ],
      },
      Post: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: [...postStatuses] },
          content: { type: "string" },
          alternativeContent: {
            type: "array",
            items: {
              type: "object",
              properties: {
                socialProviderId: { type: "string" },
                content: { type: "string" },
                socialProvider: { $ref: "#/components/schemas/Account" },
              },
              required: ["socialProviderId", "content"],
            },
          },
          socialProviders: {
            type: "array",
            items: { $ref: "#/components/schemas/Account" },
          },
          socialProviderIds: {
            type: "array",
            items: { type: "string" },
          },
          scheduledAt: { type: "number" },
          publishedAt: { type: "number" },
          privacyStatus: {},
          reviewStatus: {},
          platformPosts: {},
          providerSettings: {},
          createdAt: { type: "number" },
          updatedAt: { type: "number" },
        },
        required: [
          "id",
          "status",
          "content",
          "socialProviderIds",
          "createdAt",
          "updatedAt",
        ],
      },
      Subscription: {
        type: "object",
        properties: {
          id: { type: "string" },
          planType: { type: "string", enum: ["FREE", "ECHO", "VIBE"] },
          status: { type: "string" },
          billingPeriod: { type: "string" },
          currentPeriodStart: { type: "number" },
          currentPeriodEnd: { type: "number" },
          cancelAtPeriodEnd: { type: "boolean" },
        },
        required: ["planType", "status"],
      },
      MediaUploadUrl: {
        type: "object",
        properties: {
          uploadUrl: { type: "string", format: "uri" },
          bucketKey: { type: "string" },
          downloadUrl: { type: "string", format: "uri" },
        },
        required: ["uploadUrl", "bucketKey", "downloadUrl"],
      },
      MediaRecord: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
    headers: {
      "X-RateLimit-Limit": {
        description: "Maximum requests allowed in the current window",
        schema: { type: "string" },
      },
      "X-RateLimit-Remaining": {
        description: "Requests remaining in the current window",
        schema: { type: "string" },
      },
      "X-RateLimit-Reset": {
        description: "Unix timestamp when the rate limit window resets",
        schema: { type: "string" },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        operationId: "healthCheck",
        summary: "Health check",
        tags: ["General"],
        security: [],
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", const: "ok" } },
                  required: ["status"],
                },
              },
            },
          },
        },
      },
    },

    // Posts
    "/v1/posts": {
      get: {
        operationId: "listPosts",
        summary: "List posts",
        tags: ["Posts"],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: [...postStatuses] },
          },
          {
            name: "cursor",
            in: "query",
            description: "Pagination cursor from a previous response",
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of items per page (default 20, max 100)",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Paginated list of posts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Post" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                  required: ["data", "pagination"],
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
        },
      },
      post: {
        operationId: "createPost",
        summary: "Create a post",
        tags: ["Posts"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["SAVED", "PUBLISHED", "SCHEDULED"],
                    default: "SAVED",
                  },
                  content: { type: "string" },
                  socialProviderIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                  alternativeContent: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        socialProviderId: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["socialProviderId", "content"],
                    },
                  },
                  scheduledAt: { type: "number" },
                  reviewStatus: {},
                  privacyStatus: {},
                  providerSettings: {},
                },
                required: ["content"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Post created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: { id: { type: "string" } },
                      required: ["id"],
                    },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "400": errorResponse("Validation error"),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
        },
      },
    },
    "/v1/posts/{id}": {
      get: {
        operationId: "getPost",
        summary: "Get a post",
        tags: ["Posts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Post details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { $ref: "#/components/schemas/Post" } },
                  required: ["data"],
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
          "404": errorResponse("Post not found"),
        },
      },
      patch: {
        operationId: "updatePost",
        summary: "Update a post",
        tags: ["Posts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["SAVED", "PUBLISHED", "SCHEDULED"],
                  },
                  content: { type: "string" },
                  socialProviderIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                  alternativeContent: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        socialProviderId: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["socialProviderId", "content"],
                    },
                  },
                  scheduledAt: { type: "number" },
                  reviewStatus: {},
                  privacyStatus: {},
                  providerSettings: {},
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Post updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: { success: { type: "boolean", const: true } },
                      required: ["success"],
                    },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "400": errorResponse("Validation error"),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
          "404": errorResponse("Post not found"),
        },
      },
      delete: {
        operationId: "deletePost",
        summary: "Delete a post",
        description: "Soft-deletes a post by setting its status to DELETED.",
        tags: ["Posts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Post deleted",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: { success: { type: "boolean", const: true } },
                      required: ["success"],
                    },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
          "404": errorResponse("Post not found"),
        },
      },
    },

    // Accounts
    "/v1/accounts": {
      get: {
        operationId: "listAccounts",
        summary: "List connected social accounts",
        tags: ["Accounts"],
        responses: {
          "200": {
            description: "List of connected accounts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Account" },
                    },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
        },
      },
    },
    "/v1/accounts/{id}": {
      get: {
        operationId: "getAccount",
        summary: "Get a connected social account",
        tags: ["Accounts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Account details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Account" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
          "404": errorResponse("Account not found"),
        },
      },
    },

    // Stats
    "/v1/stats/usage": {
      get: {
        operationId: "getUsageStats",
        summary: "Get usage statistics",
        tags: ["Stats"],
        responses: {
          "200": {
            description: "Usage stats for the current billing period",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: {} },
                  required: ["data"],
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
        },
      },
    },
    "/v1/stats/subscription": {
      get: {
        operationId: "getSubscription",
        summary: "Get subscription info",
        tags: ["Stats"],
        responses: {
          "200": {
            description: "Current subscription details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Subscription" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
        },
      },
    },

    // Media
    "/v1/media/upload-url": {
      post: {
        operationId: "getMediaUploadUrl",
        summary: "Get a presigned upload URL",
        description:
          "Returns a presigned URL for uploading media directly to storage. Use the returned `bucketKey` when creating the media record.",
        tags: ["Media"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fileName: { type: "string" },
                  contentType: {
                    type: "string",
                    description: "Must start with image/ or video/",
                    examples: ["image/png", "video/mp4"],
                  },
                  fileSize: {
                    type: "number",
                    description: "File size in bytes (max 500 MB)",
                  },
                },
                required: ["fileName", "contentType"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Presigned upload URL and metadata",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/MediaUploadUrl" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "400": errorResponse("Validation error"),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
        },
      },
    },
    "/v1/media": {
      post: {
        operationId: "createMediaRecord",
        summary: "Create a media record",
        description:
          "Saves a media record after uploading. Use the `bucketKey` from the upload-url response.",
        tags: ["Media"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bucketKey: { type: "string" },
                  mediaType: {
                    type: "string",
                    enum: ["IMAGE", "VIDEO"],
                  },
                  originalFilename: { type: "string" },
                  size: { type: "number" },
                  extension: { type: "string" },
                  altText: { type: "string" },
                },
                required: ["bucketKey", "mediaType"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Media record created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/MediaRecord" },
                  },
                  required: ["data"],
                },
              },
            },
          },
          "400": errorResponse("Validation error"),
          "401": errorResponse("Unauthorized"),
          "403": errorResponse("Insufficient scopes"),
        },
      },
    },
  },
  tags: [
    { name: "General", description: "Health and status endpoints" },
    { name: "Posts", description: "Create, read, update, and delete posts" },
    { name: "Accounts", description: "Connected social media accounts" },
    { name: "Stats", description: "Usage and subscription statistics" },
    { name: "Media", description: "Upload and manage media files" },
  ],
};
