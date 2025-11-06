# Organizations Feature Architecture

> **Status**: Not Implemented 🚧 | Design Complete ✅
> **Last Updated**: 2025-11-06
> **Related**: `dodo-payments-integration.md`, `packages/payments/plans.ts`

## Table of Contents

1. [Overview](#overview)
2. [Subscription Model](#subscription-model)
3. [Organization Limits](#organization-limits)
4. [Usage Calculation](#usage-calculation)
5. [Permissions & Roles](#permissions--roles)
6. [Database Schema](#database-schema)
7. [Implementation Guide](#implementation-guide)
8. [API Patterns](#api-patterns)
9. [UI/UX Considerations](#uiux-considerations)
10. [Migration Plan](#migration-plan)

---

## Overview

The organizations feature enables users to collaborate on social media management within shared workspaces while maintaining individual subscriptions. This hybrid model allows VIBE subscribers to create organizations and share their subscription limits across personal and organizational contexts.

### Key Principles

1. **User-level subscriptions**: Organizations don't subscribe separately; owners share their personal subscription
2. **Shared limits**: Owner's subscription limits are aggregated across personal workspace + all owned organizations
3. **Role-based access**: Owner, admin, editor, viewer roles with different permissions
4. **Limit attribution**: Organization members use the owner's subscription limits when working in org contexts
5. **Free user restrictions**: Free users can join organizations but cannot create personal content

### Business Model

- **FREE users**: Cannot create organizations, can only join as members (1 org max)
- **ECHO users**: Cannot create organizations, can join as members (3 orgs max)
- **VIBE users**: Can create up to 5 organizations, unlimited org joins

---

## Subscription Model

### Plan Capabilities

```typescript
interface OrganizationLimits {
  canCreateOrgs: boolean;
  maxOwnedOrgs: number;
  maxJoinedOrgs: number;
}

const ORG_LIMITS: Record<PlanType, OrganizationLimits> = {
  FREE: {
    canCreateOrgs: false,
    maxOwnedOrgs: 0,
    maxJoinedOrgs: 1, // Can join 1 org as member
  },
  ECHO: {
    canCreateOrgs: false,
    maxOwnedOrgs: 0,
    maxJoinedOrgs: 3, // Can join 3 orgs as member
  },
  VIBE: {
    canCreateOrgs: true,
    maxOwnedOrgs: 5, // Can create/own up to 5 orgs
    maxJoinedOrgs: -1, // Unlimited joins
  },
};
```

### Ownership Transfer

- Organization ownership **cannot** be transferred
- If owner downgrades or cancels subscription:
  - Organization becomes read-only
  - Members cannot post, only view
  - Owner receives grace period notification (7 days)
  - After grace period, org is archived

---

## Organization Limits

### How Limits Work

Organizations **share** the owner's subscription limits. All resources created in any owned organization count against the owner's total limits.

### Limit Types

```typescript
interface AggregatedLimits {
  // Social accounts
  totalSocialAccounts: number; // Personal + all owned orgs
  socialAccountsLimit: number; // From subscription plan

  // Monthly posts
  totalMonthlyPosts: number; // Personal + all owned orgs (current month)
  monthlyPostsLimit: number; // From subscription plan

  // Media storage
  totalMediaStorage: number; // Personal + all owned orgs (in MB)
  mediaStorageLimit: number; // From subscription plan

  // Team members
  totalTeamMembers: number; // Sum of all org members
  teamMembersLimit: number; // From subscription plan
}
```

### Examples

#### Example 1: VIBE User with 2 Organizations

**VIBE Plan Limits**: Unlimited socials, unlimited posts, unlimited storage, 10 team members

**Usage**:
- Personal workspace: 3 social accounts, 50 posts this month
- Org A (owned): 2 social accounts, 20 posts this month, 3 members
- Org B (owned): 5 social accounts, 30 posts this month, 4 members

**Aggregated Usage**:
- Total social accounts: 10 (3 + 2 + 5) ✅ Unlimited
- Total monthly posts: 100 (50 + 20 + 30) ✅ Unlimited
- Total team members: 7 (3 + 4) ✅ Under limit (10 max)

**Result**: All within limits

#### Example 2: ECHO User Joining Organization

**ECHO Plan Limits**: 5 socials, 30 posts/month, 1GB storage, 1 team member

**Scenario**: ECHO user joins an organization owned by a VIBE user

**Behavior**:
- When working in **personal workspace**: Uses their ECHO limits
- When working in **organization**: Uses the VIBE owner's limits
- Can post unlimited in organization context (owner has unlimited)
- Cannot create personal content if personal limits exceeded

#### Example 3: FREE User in Organization

**FREE Plan Limits**: 1 social, 10 posts/month, 100MB storage, 1 team member

**Scenario**: FREE user joins an organization

**Behavior**:
- **Cannot** create personal content (no personal workspace access)
- **Can** work in organization using owner's limits
- Can create posts, connect socials, upload media within org context
- Must upgrade to ECHO/VIBE to access personal workspace

---

## Usage Calculation

### Algorithm

```typescript
async function calculateAggregatedUsage(userId: Id<'users'>): Promise<AggregatedLimits> {
  // Get user's subscription
  const subscription = await ctx.db
    .query('subscriptions')
    .withIndex('by_userId', q => q.eq('userId', userId))
    .first();

  const planType = subscription?.planType || 'FREE';
  const planLimits = PLANS[planType].limits;

  // Get all organizations owned by this user
  const ownedOrgs = await ctx.db
    .query('organizations')
    .withIndex('by_ownerId', q => q.eq('ownerId', userId))
    .collect();

  const ownedOrgIds = ownedOrgs.map(org => org._id);

  // Calculate social accounts
  const personalSocials = await ctx.db
    .query('socialProviders')
    .withIndex('by_userId', q => q.eq('userId', userId))
    .filter(q => q.eq(q.field('organizationId'), undefined))
    .collect();

  const orgSocials = await ctx.db
    .query('socialProviders')
    .filter(q => q.or(
      ...ownedOrgIds.map(orgId => q.eq(q.field('organizationId'), orgId))
    ))
    .collect();

  const totalSocialAccounts = personalSocials.length + orgSocials.length;

  // Calculate monthly posts (current month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const personalPosts = await ctx.db
    .query('posts')
    .withIndex('by_userId', q => q.eq('userId', userId))
    .filter(q =>
      q.and(
        q.gte(q.field('createdAt'), startOfMonth.getTime()),
        q.eq(q.field('organizationId'), undefined)
      )
    )
    .collect();

  const orgPosts = await ctx.db
    .query('posts')
    .filter(q =>
      q.and(
        q.gte(q.field('createdAt'), startOfMonth.getTime()),
        q.or(...ownedOrgIds.map(orgId => q.eq(q.field('organizationId'), orgId)))
      )
    )
    .collect();

  const totalMonthlyPosts = personalPosts.length + orgPosts.length;

  // Calculate media storage
  const personalMedia = await ctx.db
    .query('media')
    .withIndex('by_userId', q => q.eq('userId', userId))
    .filter(q => q.eq(q.field('organizationId'), undefined))
    .collect();

  const orgMedia = await ctx.db
    .query('media')
    .filter(q =>
      q.or(...ownedOrgIds.map(orgId => q.eq(q.field('organizationId'), orgId)))
    )
    .collect();

  const totalMediaStorage =
    personalMedia.reduce((sum, m) => sum + (m.size || 0), 0) +
    orgMedia.reduce((sum, m) => sum + (m.size || 0), 0);

  // Calculate team members
  const allOrgMembers = await ctx.db
    .query('organizationMembers')
    .filter(q =>
      q.or(...ownedOrgIds.map(orgId => q.eq(q.field('organizationId'), orgId)))
    )
    .collect();

  const totalTeamMembers = allOrgMembers.length;

  return {
    totalSocialAccounts,
    socialAccountsLimit: planLimits.socialAccounts,
    totalMonthlyPosts,
    monthlyPostsLimit: planLimits.monthlyPosts,
    totalMediaStorage: Math.round(totalMediaStorage / (1024 * 1024)), // Convert to MB
    mediaStorageLimit: planLimits.mediaStorage,
    totalTeamMembers,
    teamMembersLimit: planLimits.teamMembers,
  };
}
```

### Limit Checking

```typescript
async function canPerformAction(
  userId: Id<'users'>,
  action: 'createSocial' | 'createPost' | 'uploadMedia' | 'addMember',
  context: { organizationId?: Id<'organizations'> }
): Promise<{ allowed: boolean; reason?: string }> {
  // Determine whose limits to check
  let limitsOwnerId = userId;

  if (context.organizationId) {
    // Check if user is working in an org context
    const org = await ctx.db.get(context.organizationId);
    if (!org) {
      return { allowed: false, reason: 'Organization not found' };
    }
    limitsOwnerId = org.ownerId; // Use org owner's limits
  }

  // Get aggregated usage for the limits owner
  const usage = await calculateAggregatedUsage(limitsOwnerId);

  // Check specific action limits
  switch (action) {
    case 'createSocial':
      if (usage.socialAccountsLimit === -1) return { allowed: true };
      if (usage.totalSocialAccounts >= usage.socialAccountsLimit) {
        return {
          allowed: false,
          reason: `Social account limit reached (${usage.totalSocialAccounts}/${usage.socialAccountsLimit})`
        };
      }
      return { allowed: true };

    case 'createPost':
      if (usage.monthlyPostsLimit === -1) return { allowed: true };
      if (usage.totalMonthlyPosts >= usage.monthlyPostsLimit) {
        return {
          allowed: false,
          reason: `Monthly post limit reached (${usage.totalMonthlyPosts}/${usage.monthlyPostsLimit})`
        };
      }
      return { allowed: true };

    case 'uploadMedia':
      if (usage.mediaStorageLimit === -1) return { allowed: true };
      // Assume newFileSize is passed in context
      const newSize = (context as any).newFileSize || 0;
      if (usage.totalMediaStorage + newSize > usage.mediaStorageLimit) {
        return {
          allowed: false,
          reason: `Storage limit exceeded`
        };
      }
      return { allowed: true };

    case 'addMember':
      if (!context.organizationId) {
        return { allowed: false, reason: 'Can only add members to organizations' };
      }
      if (usage.teamMembersLimit === -1) return { allowed: true };
      if (usage.totalTeamMembers >= usage.teamMembersLimit) {
        return {
          allowed: false,
          reason: `Team member limit reached (${usage.totalTeamMembers}/${usage.teamMembersLimit})`
        };
      }
      return { allowed: true };

    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}
```

---

## Permissions & Roles

### Role Definitions

```typescript
type OrganizationRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';

interface RolePermissions {
  // Organization management
  canDeleteOrg: boolean;
  canEditOrgSettings: boolean;
  canManageMembers: boolean;
  canManageBilling: boolean; // Always false (only personal billing)

  // Content management
  canCreatePosts: boolean;
  canEditPosts: boolean;
  canDeletePosts: boolean;
  canPublishPosts: boolean;

  // Social accounts
  canConnectSocials: boolean;
  canDisconnectSocials: boolean;

  // Media
  canUploadMedia: boolean;
  canDeleteMedia: boolean;

  // View permissions
  canViewAnalytics: boolean;
  canViewPosts: boolean;
  canViewMembers: boolean;
}

const ROLE_PERMISSIONS: Record<OrganizationRole, RolePermissions> = {
  OWNER: {
    canDeleteOrg: true,
    canEditOrgSettings: true,
    canManageMembers: true,
    canManageBilling: false, // Billing is personal, not org-level
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: true,
    canPublishPosts: true,
    canConnectSocials: true,
    canDisconnectSocials: true,
    canUploadMedia: true,
    canDeleteMedia: true,
    canViewAnalytics: true,
    canViewPosts: true,
    canViewMembers: true,
  },
  ADMIN: {
    canDeleteOrg: false,
    canEditOrgSettings: true,
    canManageMembers: true,
    canManageBilling: false,
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: true,
    canPublishPosts: true,
    canConnectSocials: true,
    canDisconnectSocials: true,
    canUploadMedia: true,
    canDeleteMedia: true,
    canViewAnalytics: true,
    canViewPosts: true,
    canViewMembers: true,
  },
  EDITOR: {
    canDeleteOrg: false,
    canEditOrgSettings: false,
    canManageMembers: false,
    canManageBilling: false,
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: false,
    canPublishPosts: true,
    canConnectSocials: false,
    canDisconnectSocials: false,
    canUploadMedia: true,
    canDeleteMedia: false,
    canViewAnalytics: true,
    canViewPosts: true,
    canViewMembers: true,
  },
  VIEWER: {
    canDeleteOrg: false,
    canEditOrgSettings: false,
    canManageMembers: false,
    canManageBilling: false,
    canCreatePosts: false,
    canEditPosts: false,
    canDeletePosts: false,
    canPublishPosts: false,
    canConnectSocials: false,
    canDisconnectSocials: false,
    canUploadMedia: false,
    canDeleteMedia: false,
    canViewAnalytics: false,
    canViewPosts: true,
    canViewMembers: true,
  },
};
```

### Permission Checking

```typescript
async function checkPermission(
  userId: Id<'users'>,
  organizationId: Id<'organizations'>,
  permission: keyof RolePermissions
): Promise<boolean> {
  // Get user's role in this organization
  const membership = await ctx.db
    .query('organizationMembers')
    .withIndex('by_userId_and_orgId', q =>
      q.eq('userId', userId).eq('organizationId', organizationId)
    )
    .first();

  if (!membership) {
    // Check if user is the owner
    const org = await ctx.db.get(organizationId);
    if (org?.ownerId === userId) {
      return ROLE_PERMISSIONS.OWNER[permission];
    }
    return false; // Not a member
  }

  return ROLE_PERMISSIONS[membership.role][permission];
}
```

---

## Database Schema

### New Tables

#### Organizations Table

```typescript
export const organizations = defineTable({
  name: v.string(), // Organization name
  slug: v.string(), // URL-friendly identifier
  description: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),

  // Ownership
  ownerId: v.id('users'), // The user who created and owns this org

  // Settings
  settings: v.optional(v.object({
    defaultTimezone: v.optional(v.string()),
    defaultPostFormat: v.optional(v.string()),
  })),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  archivedAt: v.optional(v.number()), // When org was archived (owner downgrade)
})
  .index('by_ownerId', ['ownerId'])
  .index('by_slug', ['slug']);
```

#### Organization Members Table

```typescript
export const organizationMembers = defineTable({
  organizationId: v.id('organizations'),
  userId: v.id('users'),
  role: v.union(
    v.literal('ADMIN'),
    v.literal('EDITOR'),
    v.literal('VIEWER')
  ), // OWNER is implicit (org.ownerId)

  // Invitation metadata
  invitedBy: v.id('users'), // Who invited this member
  invitedAt: v.number(),
  joinedAt: v.optional(v.number()), // When they accepted

  // Status
  status: v.union(
    v.literal('PENDING'), // Invitation sent, not yet accepted
    v.literal('ACTIVE'),  // Member is active
    v.literal('SUSPENDED') // Temporarily suspended
  ),
})
  .index('by_organizationId', ['organizationId'])
  .index('by_userId', ['userId'])
  .index('by_userId_and_orgId', ['userId', 'organizationId']);
```

### Updates to Existing Tables

#### Posts Table - Already has `organizationId` field ✅
```typescript
// No changes needed - field already exists
organizationId: v.optional(v.id('organizations'))
```

#### Social Providers Table - Already has `organizationId` field ✅
```typescript
// No changes needed - field already exists
organizationId: v.optional(v.id('organizations'))
```

#### Media Table - Already has `organizationId` field ✅
```typescript
// No changes needed - field already exists
organizationId: v.optional(v.id('organizations'))
```

---

## Implementation Guide

### Phase 1: Database Setup

1. **Create new tables**:
   - `organizations`
   - `organizationMembers`

2. **Add indexes**:
   - `by_ownerId` on organizations
   - `by_userId_and_orgId` on organizationMembers
   - `by_organizationId` on existing tables (posts, socialProviders, media)

### Phase 2: Backend API

#### Organization Management

```typescript
// convex/organizations.ts

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check if user can create orgs
    const subscription = await getUserSubscription(ctx, userId);
    const planType = subscription?.planType || 'FREE';

    if (!ORG_LIMITS[planType].canCreateOrgs) {
      throw new Error('Upgrade to VIBE to create organizations');
    }

    // Check max owned orgs
    const ownedOrgs = await ctx.db
      .query('organizations')
      .withIndex('by_ownerId', q => q.eq('ownerId', userId))
      .collect();

    if (ownedOrgs.length >= ORG_LIMITS[planType].maxOwnedOrgs) {
      throw new Error(`Maximum ${ORG_LIMITS[planType].maxOwnedOrgs} organizations reached`);
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query('organizations')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .first();

    if (existing) {
      throw new Error('Organization slug already taken');
    }

    // Create organization
    const orgId = await ctx.db.insert('organizations', {
      name: args.name,
      slug: args.slug,
      description: args.description,
      ownerId: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return orgId;
  },
});

export const inviteMember = mutation({
  args: {
    organizationId: v.id('organizations'),
    email: v.string(),
    role: v.union(v.literal('ADMIN'), v.literal('EDITOR'), v.literal('VIEWER')),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Check permission
    const canManage = await checkPermission(userId, args.organizationId, 'canManageMembers');
    if (!canManage) {
      throw new Error('You do not have permission to invite members');
    }

    // Check team member limit
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error('Organization not found');

    const canAdd = await canPerformAction(org.ownerId, 'addMember', {
      organizationId: args.organizationId,
    });

    if (!canAdd.allowed) {
      throw new Error(canAdd.reason);
    }

    // Find user by email
    const invitedUser = await ctx.db
      .query('users')
      .filter(q => q.eq(q.field('email'), args.email))
      .first();

    if (!invitedUser) {
      throw new Error('User not found');
    }

    // Check if already a member
    const existing = await ctx.db
      .query('organizationMembers')
      .withIndex('by_userId_and_orgId', q =>
        q.eq('userId', invitedUser._id).eq('organizationId', args.organizationId)
      )
      .first();

    if (existing) {
      throw new Error('User is already a member');
    }

    // Create invitation
    await ctx.db.insert('organizationMembers', {
      organizationId: args.organizationId,
      userId: invitedUser._id,
      role: args.role,
      invitedBy: userId,
      invitedAt: Date.now(),
      status: 'PENDING',
    });

    // TODO: Send invitation email

    return { success: true };
  },
});
```

### Phase 3: Frontend Implementation

#### Context Switching

```typescript
// hooks/use-workspace-context.ts

interface WorkspaceContext {
  type: 'PERSONAL' | 'ORGANIZATION';
  organizationId?: Id<'organizations'>;
  organization?: Organization;
}

export function useWorkspaceContext() {
  const [context, setContext] = useState<WorkspaceContext>({
    type: 'PERSONAL',
  });

  const switchToPersonal = () => {
    setContext({ type: 'PERSONAL' });
  };

  const switchToOrganization = (org: Organization) => {
    setContext({
      type: 'ORGANIZATION',
      organizationId: org._id,
      organization: org,
    });
  };

  return {
    context,
    isPersonal: context.type === 'PERSONAL',
    isOrganization: context.type === 'ORGANIZATION',
    switchToPersonal,
    switchToOrganization,
  };
}
```

#### Usage Limits Display

```typescript
// components/billing/usage-stats.tsx

export function UsageStats() {
  const { context } = useWorkspaceContext();
  const usage = useQuery(api.usage.getAggregatedUsage);

  if (!usage) return <LoadingSpinner />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage & Limits</CardTitle>
        <CardDescription>
          {context.type === 'ORGANIZATION'
            ? 'Shared across all organizations owned by the org owner'
            : 'Your personal usage across all owned organizations'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsageMeter
          label="Social Accounts"
          current={usage.totalSocialAccounts}
          limit={usage.socialAccountsLimit}
        />
        <UsageMeter
          label="Monthly Posts"
          current={usage.totalMonthlyPosts}
          limit={usage.monthlyPostsLimit}
        />
        <UsageMeter
          label="Media Storage"
          current={usage.totalMediaStorage}
          limit={usage.mediaStorageLimit}
          unit="MB"
        />
        <UsageMeter
          label="Team Members"
          current={usage.totalTeamMembers}
          limit={usage.teamMembersLimit}
        />
      </CardContent>
    </Card>
  );
}
```

---

## API Patterns

### Creating Resources with Context

```typescript
// When creating a post
const { context } = useWorkspaceContext();

await createPost({
  content: 'Hello world',
  socialProviderIds: ['...'],
  organizationId: context.organizationId, // undefined for personal, org ID for org context
});
```

### Querying with Context

```typescript
// Get posts for current context
export const listPosts = query({
  args: {
    organizationId: v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    if (args.organizationId) {
      // Check user has access to this org
      const hasAccess = await checkOrgAccess(ctx, userId, args.organizationId);
      if (!hasAccess) throw new Error('Access denied');

      // Return org posts
      return ctx.db
        .query('posts')
        .filter(q => q.eq(q.field('organizationId'), args.organizationId))
        .collect();
    } else {
      // Return personal posts
      return ctx.db
        .query('posts')
        .withIndex('by_userId', q => q.eq('userId', userId))
        .filter(q => q.eq(q.field('organizationId'), undefined))
        .collect();
    }
  },
});
```

---

## UI/UX Considerations

### Workspace Switcher

Display a dropdown in the top navigation:
```
[ Personal Workspace ▼ ]
  - Personal Workspace
  - Org A (Owner)
  - Org B (Admin)
  - Org C (Editor)
  + Create Organization
```

### Usage Warnings

When user is at 80% of any limit:
```typescript
if (usage.totalSocialAccounts / usage.socialAccountsLimit >= 0.8) {
  showWarning('You are approaching your social account limit');
}
```

### Upgrade Prompts

For FREE users trying to create personal content:
```typescript
if (planType === 'FREE' && !context.organizationId) {
  return (
    <UpgradePrompt
      feature="Personal Workspace"
      requiredPlan="ECHO"
      description="FREE users can only work in organizations. Upgrade to ECHO to create personal content."
    />
  );
}
```

### Organization Settings

Organization owners see additional settings:
- Danger zone: Archive organization
- Member management
- Usage breakdown (personal vs each org)

---

## Migration Plan

### Phase 1: Backend (Week 1-2)

- [ ] Create database tables and indexes
- [ ] Implement organization CRUD operations
- [ ] Implement member invitation system
- [ ] Update limit checking to use aggregation
- [ ] Add permission checking middleware

### Phase 2: Frontend Core (Week 3-4)

- [ ] Create workspace context provider
- [ ] Build workspace switcher component
- [ ] Update navigation to support context
- [ ] Implement organization settings page
- [ ] Add member management UI

### Phase 3: Integration (Week 5-6)

- [ ] Update post creation to support context
- [ ] Update social provider connection to support context
- [ ] Update media upload to support context
- [ ] Modify all queries to filter by context
- [ ] Update usage stats to show aggregated limits

### Phase 4: Polish & Testing (Week 7-8)

- [ ] Add onboarding flow for first organization
- [ ] Implement invitation acceptance flow
- [ ] Add email notifications
- [ ] Test all permission combinations
- [ ] Load testing with multiple orgs
- [ ] Update documentation

---

## Future Enhancements

### Planned Features

1. **Organization Transfer**: Allow ownership transfer with subscription handoff
2. **Custom Roles**: Let organizations define custom role permissions
3. **Usage Reports**: Detailed breakdown of usage per organization
4. **Audit Logs**: Track who did what in organization
5. **Organization Templates**: Pre-configured org settings for common use cases
6. **Billing Insights**: Show cost allocation per organization
7. **Resource Quotas**: Let owners set per-org limits within their total subscription
8. **SSO Integration**: Enterprise SSO for organization members

### Scaling Considerations

As organizations grow:
- Implement pagination for org member lists
- Cache aggregated usage (refresh every 5 minutes)
- Use background jobs for usage calculations
- Consider separate database indexes for high-volume orgs

---

**Last Updated**: 2025-11-06
**Status**: Design complete, ready for implementation
**Estimated Implementation Time**: 8 weeks
**Dependencies**: Dodo Payments integration (complete), Clerk auth (complete)
