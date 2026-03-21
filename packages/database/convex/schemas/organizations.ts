import { v } from "convex/values";

// ============================================================================
// ORGANIZATION SCHEMAS
// ============================================================================

// Base organization schema without system fields
export const baseOrganizationSchema = v.object({
  clerkOrgId: v.string(),
  name: v.string(),
  slug: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  createdBy: v.string(), // Clerk user ID of creator
  maxMembers: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Organization schema with system fields (for returns)
export const organizationSchema = v.object({
  _id: v.id("organizations"),
  _creationTime: v.number(),
  ...baseOrganizationSchema.fields,
});

// Base organization member schema without system fields
export const baseOrganizationMemberSchema = v.object({
  organizationId: v.id("organizations"),
  clerkOrgId: v.string(),
  userId: v.id("users"),
  clerkUserId: v.string(),
  role: v.string(), // "org:admin" | "org:member"
  joinedAt: v.number(),
  updatedAt: v.number(),
});

// Organization member schema with system fields (for returns)
export const organizationMemberSchema = v.object({
  _id: v.id("organizationMembers"),
  _creationTime: v.number(),
  ...baseOrganizationMemberSchema.fields,
});
