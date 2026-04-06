import { PLANS } from "@delulu/payments/plans";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { organizationMemberSchema, organizationSchema } from "./schemas";
import { getCurrentTimestamp } from "./utils";

// ============================================================================
// INTERNAL MUTATIONS (webhook-driven)
// ============================================================================

/**
 * Upsert an organization from a Clerk webhook event.
 * Handles both organization.created and organization.updated events.
 */
export const upsertFromClerk = internalMutation({
  args: { data: v.any() },
  async handler(ctx, { data }) {
    const now = getCurrentTimestamp();

    const orgAttributes = {
      clerkOrgId: data.id as string,
      name: (data.name as string) || "Untitled Organization",
      slug: data.slug as string | undefined,
      imageUrl: data.image_url as string | undefined,
      createdBy: data.created_by as string,
      maxMembers: data.max_allowed_memberships as number | undefined,
      updatedAt: now,
    };

    // Try to find existing org by clerkOrgId
    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", data.id))
      .unique();

    if (existingOrg) {
      await ctx.db.patch(existingOrg._id, orgAttributes);
    } else {
      // Check if the creator's plan allows org creation
      const creatorClerkId = data.created_by as string;
      const creator = await ctx.db
        .query("users")
        .withIndex("by_external_id", (q) => q.eq("externalId", creatorClerkId))
        .unique();

      if (creator) {
        // Resolve the creator's plan type
        let planType: "FREE" | "ECHO" | "VIBE" = "FREE";
        if (creator.subscriptionId) {
          const subscription = await ctx.db.get(creator.subscriptionId);
          if (subscription?.status === "ACTIVE") {
            planType = subscription.planType;
          }
        }

        const orgLimit = PLANS[planType].limits.organizations;

        // Count existing orgs created by this user
        const existingOrgs = await ctx.db
          .query("organizations")
          .withIndex("by_created_by", (q) => q.eq("createdBy", creatorClerkId))
          .collect();

        if (orgLimit !== -1 && existingOrgs.length >= orgLimit) {
          console.error(
            `[org-limit] User ${creatorClerkId} exceeded org limit: ` +
              `${existingOrgs.length}/${orgLimit} on ${planType} plan. ` +
              `Org ${data.id} will still be synced but this should be investigated.`
          );
        }
      }

      await ctx.db.insert("organizations", {
        ...orgAttributes,
        createdAt: now,
      });
    }
  },
});

/**
 * Delete an organization and all its members from a Clerk webhook event.
 */
export const deleteFromClerk = internalMutation({
  args: { clerkOrgId: v.string() },
  async handler(ctx, { clerkOrgId }) {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", clerkOrgId))
      .unique();

    if (!org) {
      return;
    }

    // Delete all members of this organization
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_id", (q) => q.eq("organizationId", org._id))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete the organization
    await ctx.db.delete(org._id);
  },
});

/**
 * Add a member to an organization from a Clerk webhook event.
 */
export const addMember = internalMutation({
  args: { data: v.any() },
  async handler(ctx, { data }) {
    const now = getCurrentTimestamp();
    const clerkOrgId = data.organization?.id as string;
    const clerkUserId = data.public_user_data?.user_id as string;
    const role = (data.role as string) || "org:member";

    // Find the organization
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", clerkOrgId))
      .unique();
    if (!org) {
      console.error(`[addMember] Organization not found: ${clerkOrgId}`);
      return;
    }

    // Find the user by their Clerk external ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", clerkUserId))
      .unique();
    if (!user) {
      console.error(`[addMember] User not found: ${clerkUserId}`);
      return;
    }

    // Check if member already exists
    const existingMember = await ctx.db
      .query("organizationMembers")
      .withIndex("by_clerk_org_user", (q) =>
        q.eq("clerkOrgId", clerkOrgId).eq("clerkUserId", clerkUserId)
      )
      .unique();

    if (existingMember) {
      // Update existing member
      await ctx.db.patch(existingMember._id, { role, updatedAt: now });
    } else {
      // Insert new member
      await ctx.db.insert("organizationMembers", {
        organizationId: org._id,
        clerkOrgId,
        userId: user._id,
        clerkUserId,
        role,
        joinedAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Remove a member from an organization from a Clerk webhook event.
 */
export const removeMember = internalMutation({
  args: { data: v.any() },
  async handler(ctx, { data }) {
    const clerkOrgId = data.organization?.id as string;
    const clerkUserId = data.public_user_data?.user_id as string;

    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_clerk_org_user", (q) =>
        q.eq("clerkOrgId", clerkOrgId).eq("clerkUserId", clerkUserId)
      )
      .unique();

    if (member) {
      await ctx.db.delete(member._id);
    }
  },
});

/**
 * Update a member's role from a Clerk webhook event.
 */
export const updateMemberRole = internalMutation({
  args: { data: v.any() },
  async handler(ctx, { data }) {
    const clerkOrgId = data.organization?.id as string;
    const clerkUserId = data.public_user_data?.user_id as string;
    const role = (data.role as string) || "org:member";

    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_clerk_org_user", (q) =>
        q.eq("clerkOrgId", clerkOrgId).eq("clerkUserId", clerkUserId)
      )
      .unique();

    if (member) {
      await ctx.db.patch(member._id, {
        role,
        updatedAt: getCurrentTimestamp(),
      });
    }
  },
});

// ============================================================================
// PUBLIC QUERIES
// ============================================================================

/**
 * Get all organizations for the current authenticated user.
 * Joins organizationMembers -> organizations.
 */
export const getUserOrganizations = query({
  args: {},
  returns: v.array(organizationSchema),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_external_id", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) {
      return [];
    }

    // Get all memberships for this user
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch the organizations
    const orgs = await Promise.all(
      memberships.map((m) => ctx.db.get(m.organizationId))
    );

    console.log(orgs, "orgs");

    return orgs.filter((o): o is NonNullable<typeof o> => o !== null);
  },
});

/**
 * Get all members of an organization (with user data).
 */
export const getOrganizationMembers = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(
    v.object({
      ...organizationMemberSchema.fields,
      user: v.object({
        _id: v.id("users"),
        name: v.string(),
        email: v.string(),
        image: v.optional(v.string()),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_id", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        if (!user) {
          return null;
        }
        return {
          ...member,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        };
      })
    );

    return membersWithUsers.filter(
      (m): m is NonNullable<typeof m> => m !== null
    );
  },
});
