import { Schema } from "effect";
import { SystemFields } from "./common";

export const LegacyOrganization = Schema.Struct({
  ...SystemFields,
  clerkOrgId: Schema.String,
  name: Schema.String,
  slug: Schema.optional(Schema.String),
  imageUrl: Schema.optional(Schema.String),
  createdBy: Schema.String,
  maxMembers: Schema.optional(Schema.Number),
  createdAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyOrganization = typeof LegacyOrganization.Type;

export const LegacyOrganizationMember = Schema.Struct({
  ...SystemFields,
  organizationId: Schema.String,
  clerkOrgId: Schema.String,
  userId: Schema.String,
  clerkUserId: Schema.String,
  role: Schema.String,
  joinedAt: Schema.optional(Schema.Number),
  updatedAt: Schema.optional(Schema.Number),
});
export type LegacyOrganizationMember = typeof LegacyOrganizationMember.Type;
