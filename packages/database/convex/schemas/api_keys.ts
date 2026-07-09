import { v } from "convex/values";

// ============================================================================
// API KEY SCHEMAS
// ============================================================================

export const apiKeyScopeSchema = v.union(
  v.literal("posts:read"),
  v.literal("posts:write"),
  v.literal("accounts:read"),
  v.literal("stats:read"),
  v.literal("media:write"),
  v.literal("reviews:read")
);

export const baseApiKeySchema = v.object({
  userId: v.id("users"),
  name: v.string(),
  keyHash: v.string(),
  keyPrefix: v.string(),
  scopes: v.array(apiKeyScopeSchema),
  organizationId: v.optional(v.string()),
  lastUsedAt: v.optional(v.number()),
  revokedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const apiKeySchema = v.object({
  _id: v.id("apiKeys"),
  _creationTime: v.number(),
  ...baseApiKeySchema.fields,
});
