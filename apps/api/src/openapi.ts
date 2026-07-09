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

const MediaItem = {
  type: "object" as const,
  description: "A media attachment (image or video)",
  properties: {
    url: {
      type: "string" as const,
      format: "uri",
      description: "Public URL of the media file",
      examples: ["https://cdn.delulu.social/media/abc123.jpg"],
    },
    type: {
      type: "string" as const,
      description: "Media type",
      enum: ["IMAGE", "VIDEO"],
    },
    alt_text: {
      type: "string" as const,
      description: "Accessibility description for the media",
      examples: ["A sunset over the ocean"],
    },
  },
  required: ["url", "type"],
};

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Delulu Social API",
    version: "1.0.0",
    description: `The Delulu Social API lets you create and schedule social media posts across multiple platforms programmatically.

## Quick Start

\`\`\`bash
# Create a post
curl -X POST https://api.delulu.social/v1/posts \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"caption": "Hello world!", "account_ids": ["acc_123"]}'
\`\`\`

## Authentication

All \`/v1\` endpoints require a Bearer token via the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

Create API keys in your [Delulu Social dashboard](https://solulu.delulu.social/settings/api).

## Scopes

API keys are scoped to limit access:

| Scope | Access |
|-------|--------|
| \`posts:read\` | List and retrieve posts |
| \`posts:write\` | Create, update, and delete posts |
| \`accounts:read\` | List and retrieve connected social accounts |
| \`stats:read\` | View usage and subscription info |
| \`media:write\` | Upload media files |

## Rate Limits

| Plan | Per Minute | Per Day |
|------|-----------|---------|
| FREE | 20 | 500 |
| ECHO | 60 | 5,000 |
| VIBE | 120 | 20,000 |

Rate limit info is returned in headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`.
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
                description: "Machine-readable error code",
                examples: [
                  "NOT_FOUND",
                  "UNAUTHORIZED",
                  "FORBIDDEN",
                  "BAD_REQUEST",
                  "RATE_LIMIT_EXCEEDED",
                  "INTERNAL_ERROR",
                ],
              },
              message: {
                type: "string",
                description: "Human-readable error message",
              },
            },
            required: ["code", "message"],
          },
        },
        required: ["error"],
      },
      Pagination: {
        type: "object",
        properties: {
          cursor: {
            type: ["string", "null"],
            description:
              "Cursor to pass as a query parameter to fetch the next page. Null if no more results.",
          },
          hasMore: {
            type: "boolean",
            description: "Whether more results are available",
          },
        },
        required: ["cursor", "hasMore"],
      },
      Account: {
        type: "object",
        description: "A connected social media account",
        properties: {
          id: {
            type: "string",
            description: "Unique account identifier",
            examples: ["acc_abc123"],
          },
          platform: {
            type: "string",
            description: "Social media platform",
            examples: ["twitter", "instagram", "linkedin", "tiktok"],
          },
          username: {
            type: "string",
            description: "Account username or handle",
            examples: ["johndoe"],
          },
          full_name: {
            type: "string",
            description: "Display name on the platform",
            examples: ["John Doe"],
          },
          profile_image: {
            type: "string",
            format: "uri",
            description: "URL of the account's profile picture",
          },
          is_active: {
            type: "boolean",
            description:
              "Whether the account connection is active and can be posted to",
          },
          created_at: {
            type: "number",
            description:
              "When the account was connected (Unix timestamp in ms)",
          },
        },
        required: [
          "id",
          "platform",
          "username",
          "full_name",
          "profile_image",
          "is_active",
          "created_at",
        ],
      },
      Post: {
        type: "object",
        description: "A social media post",
        properties: {
          id: {
            type: "string",
            description: "Unique post identifier",
            examples: ["post_xyz789"],
          },
          status: {
            type: "string",
            enum: [...postStatuses],
            description:
              "Current status of the post. SAVED = draft, SCHEDULED = queued for future publishing.",
            examples: ["SAVED"],
          },
          caption: {
            type: "string",
            description: "The post's text content",
            examples: ["Check out our new product launch! 🚀"],
          },
          media: {
            type: "array",
            description: "Media attachments (images or videos)",
            items: MediaItem,
          },
          account_ids: {
            type: "array",
            description: "IDs of accounts this post will be published to",
            items: { type: "string" },
            examples: [["acc_abc123", "acc_def456"]],
          },
          accounts: {
            type: "array",
            description:
              "Populated account objects for each account_id (included in GET responses)",
            items: { $ref: "#/components/schemas/Account" },
          },
          account_overrides: {
            type: "array",
            description:
              "Per-account content overrides. Use this to customize the caption or media for a specific account.",
            items: {
              type: "object",
              properties: {
                account_id: {
                  type: "string",
                  description: "The account to override content for",
                },
                caption: {
                  type: "string",
                  description: "Override caption for this account",
                },
                media: {
                  type: "array",
                  description: "Override media for this account",
                  items: MediaItem,
                },
                account: {
                  $ref: "#/components/schemas/Account",
                  description:
                    "Populated account object (included in GET responses)",
                },
              },
              required: ["account_id"],
            },
          },
          account_settings: {
            type: "array",
            description:
              "Per-account platform-specific settings (e.g., Instagram first comment, Twitter thread mode)",
            items: {
              type: "object",
              properties: {
                account_id: {
                  type: "string",
                  description: "The account these settings apply to",
                },
                type: {
                  type: "string",
                  description: "Settings type identifier",
                },
                settings: {
                  type: "object",
                  description: "Platform-specific settings object",
                },
              },
              required: ["account_id", "type", "settings"],
            },
          },
          scheduled_at: {
            type: "number",
            description:
              "When the post is scheduled to publish (Unix timestamp in ms). Required when status is SCHEDULED.",
          },
          published_at: {
            type: "number",
            description:
              "When the post was published (Unix timestamp in ms). Set automatically.",
          },
          created_at: {
            type: "number",
            description: "When the post was created (Unix timestamp in ms)",
          },
          updated_at: {
            type: "number",
            description:
              "When the post was last updated (Unix timestamp in ms)",
          },
        },
        required: [
          "id",
          "status",
          "caption",
          "account_ids",
          "created_at",
          "updated_at",
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
          uploadUrl: {
            type: "string",
            format: "uri",
            description: "Presigned URL to upload the file via PUT request",
          },
          bucketKey: {
            type: "string",
            description:
              "Storage key to reference when creating the media record",
          },
          downloadUrl: {
            type: "string",
            format: "uri",
            description:
              "Public URL where the file will be accessible after upload",
          },
        },
        required: ["uploadUrl", "bucketKey", "downloadUrl"],
      },
      MediaRecord: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Unique media record identifier",
          },
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
        description:
          "Returns a paginated list of posts. Use the `cursor` from the response to fetch the next page.",
        tags: ["Posts"],
        parameters: [
          {
            name: "status",
            in: "query",
            description:
              "Filter by post status (e.g., SAVED, SCHEDULED, PUBLISHED)",
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
            description: "Number of posts per page (default 20, max 100)",
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
                example: {
                  data: [
                    {
                      id: "post_xyz789",
                      status: "SCHEDULED",
                      caption: "Check out our new product launch! 🚀",
                      media: [],
                      account_ids: ["acc_abc123"],
                      accounts: [
                        {
                          id: "acc_abc123",
                          platform: "twitter",
                          username: "johndoe",
                          full_name: "John Doe",
                          profile_image: "https://example.com/avatar.jpg",
                          is_active: true,
                          created_at: 1_709_913_600_000,
                        },
                      ],
                      scheduled_at: 1_709_913_600_000,
                      created_at: 1_709_827_200_000,
                      updated_at: 1_709_827_200_000,
                    },
                  ],
                  pagination: { cursor: null, hasMore: false },
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
        description:
          "Create a new post. Set status to SCHEDULED with a scheduled_at timestamp to schedule it, or SAVED to save as a draft.",
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
                    description:
                      "Post status. Use SAVED for drafts, SCHEDULED to queue for publishing.",
                  },
                  caption: {
                    type: "string",
                    description: "The post's text content",
                    examples: ["Check out our new product launch! 🚀"],
                  },
                  media: {
                    type: "array",
                    description: "Media attachments to include with the post",
                    items: MediaItem,
                  },
                  account_ids: {
                    type: "array",
                    description: "IDs of accounts to publish this post to",
                    items: { type: "string" },
                  },
                  account_overrides: {
                    type: "array",
                    description:
                      "Per-account content overrides for customizing the caption or media per platform",
                    items: {
                      type: "object",
                      properties: {
                        account_id: { type: "string" },
                        caption: { type: "string" },
                        media: { type: "array", items: MediaItem },
                      },
                      required: ["account_id"],
                    },
                  },
                  account_settings: {
                    type: "array",
                    description: "Per-account platform-specific settings",
                    items: {
                      type: "object",
                      properties: {
                        account_id: { type: "string" },
                        type: { type: "string" },
                        settings: { type: "object" },
                      },
                      required: ["account_id", "type", "settings"],
                    },
                  },
                  scheduled_at: {
                    type: "number",
                    description:
                      "When to publish the post (Unix timestamp in ms). Required when status is SCHEDULED.",
                  },
                },
                required: ["caption"],
              },
              example: {
                caption: "Check out our new product launch! 🚀",
                account_ids: ["acc_abc123", "acc_def456"],
                status: "SCHEDULED",
                scheduled_at: 1_709_913_600_000,
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
                      properties: {
                        id: {
                          type: "string",
                          description: "ID of the created post",
                        },
                      },
                      required: ["id"],
                    },
                  },
                  required: ["data"],
                },
                example: { data: { id: "post_xyz789" } },
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
        description: "Retrieve a single post by ID with all its details.",
        tags: ["Posts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Post ID",
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
        description:
          "Update a post's content, status, accounts, or schedule. Only include the fields you want to change.",
        tags: ["Posts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Post ID",
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
                    description: "Update the post's status",
                  },
                  caption: {
                    type: "string",
                    description: "Update the post's text content",
                  },
                  media: {
                    type: "array",
                    description: "Replace the post's media attachments",
                    items: MediaItem,
                  },
                  account_ids: {
                    type: "array",
                    description: "Update which accounts to publish to",
                    items: { type: "string" },
                  },
                  account_overrides: {
                    type: "array",
                    description: "Update per-account content overrides",
                    items: {
                      type: "object",
                      properties: {
                        account_id: { type: "string" },
                        caption: { type: "string" },
                        media: { type: "array", items: MediaItem },
                      },
                      required: ["account_id"],
                    },
                  },
                  account_settings: {
                    type: "array",
                    description: "Update per-account platform settings",
                    items: {
                      type: "object",
                      properties: {
                        account_id: { type: "string" },
                        type: { type: "string" },
                        settings: { type: "object" },
                      },
                      required: ["account_id", "type", "settings"],
                    },
                  },
                  scheduled_at: {
                    type: "number",
                    description: "Update the scheduled publish time",
                  },
                },
              },
              example: {
                caption: "Updated caption text",
                scheduled_at: 1_710_000_000_000,
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
                      properties: {
                        success: { type: "boolean", const: true },
                      },
                      required: ["success"],
                    },
                  },
                  required: ["data"],
                },
                example: { data: { success: true } },
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
            description: "Post ID",
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
                      properties: {
                        success: { type: "boolean", const: true },
                      },
                      required: ["success"],
                    },
                  },
                  required: ["data"],
                },
                example: { data: { success: true } },
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
        summary: "List connected accounts",
        description:
          "Returns all social media accounts connected to your workspace.",
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
                example: {
                  data: [
                    {
                      id: "acc_abc123",
                      platform: "twitter",
                      username: "johndoe",
                      full_name: "John Doe",
                      profile_image: "https://example.com/avatar.jpg",
                      is_active: true,
                      created_at: 1_709_913_600_000,
                    },
                  ],
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
        summary: "Get an account",
        description: "Retrieve details of a single connected social account.",
        tags: ["Accounts"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Account ID",
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
        description:
          "Returns usage stats for the current billing period, including post counts and API call counts.",
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
        description:
          "Returns your current subscription plan, status, and billing period.",
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
        description: `Returns a presigned URL for uploading media directly to storage. Two-step process:

1. Call this endpoint to get an \`uploadUrl\` and \`bucketKey\`
2. PUT your file to the \`uploadUrl\`, then call POST /v1/media with the \`bucketKey\` to create a record`,
        tags: ["Media"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fileName: {
                    type: "string",
                    description: "Original file name",
                    examples: ["photo.jpg"],
                  },
                  contentType: {
                    type: "string",
                    description:
                      "MIME type of the file (must start with image/ or video/)",
                    examples: ["image/png", "video/mp4"],
                  },
                  fileSize: {
                    type: "number",
                    description: "File size in bytes (max 500 MB)",
                    examples: [1_048_576],
                  },
                },
                required: ["fileName", "contentType"],
              },
              example: {
                fileName: "product-photo.jpg",
                contentType: "image/jpeg",
                fileSize: 2_097_152,
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
          "Creates a media record after uploading the file. Use the `bucketKey` from the upload-url response.",
        tags: ["Media"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bucketKey: {
                    type: "string",
                    description:
                      "Storage key returned by the upload-url endpoint",
                  },
                  mediaType: {
                    type: "string",
                    enum: ["IMAGE", "VIDEO"],
                    description: "Type of media",
                  },
                  originalFilename: {
                    type: "string",
                    description: "Original file name",
                  },
                  size: {
                    type: "number",
                    description: "File size in bytes",
                  },
                  extension: {
                    type: "string",
                    description: "File extension (e.g., jpg, mp4)",
                  },
                  altText: {
                    type: "string",
                    description: "Accessibility description",
                  },
                },
                required: ["bucketKey", "mediaType"],
              },
              example: {
                bucketKey: "media/abc123.jpg",
                mediaType: "IMAGE",
                originalFilename: "product-photo.jpg",
                size: 2_097_152,
                extension: "jpg",
                altText: "Product showcase photo",
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
                example: { data: { id: "media_abc123" } },
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
    {
      name: "Posts",
      description: "Create, read, update, and delete social media posts",
    },
    {
      name: "Accounts",
      description: "View connected social media accounts",
    },
    { name: "Stats", description: "Usage and subscription information" },
    {
      name: "Media",
      description:
        "Upload and manage media files for use in posts (two-step: get upload URL, then create record)",
    },
  ],
};
