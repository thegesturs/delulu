import { type Infer, v } from 'convex/values';

// ============================================================================
// AUTOMATION ENUMS
// ============================================================================

export const automationTriggerTypeSchema = v.union(
  v.literal('COMMENT'),
  v.literal('MENTION'),
  v.literal('STORY_REPLY')
);

export const AUTOMATION_TRIGGER_TYPE = {
  COMMENT: 'COMMENT',
  MENTION: 'MENTION',
  STORY_REPLY: 'STORY_REPLY',
} as const;

export type AutomationTriggerType =
  (typeof AUTOMATION_TRIGGER_TYPE)[keyof typeof AUTOMATION_TRIGGER_TYPE];

export const automationConditionOperatorSchema = v.union(
  v.literal('contains'),
  v.literal('not_contains'),
  v.literal('equals'),
  v.literal('starts_with'),
  v.literal('ends_with'),
  v.literal('regex'),
  v.literal('always')
);

export const AUTOMATION_CONDITION_OPERATOR = {
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  EQUALS: 'equals',
  STARTS_WITH: 'starts_with',
  ENDS_WITH: 'ends_with',
  REGEX: 'regex',
  ALWAYS: 'always',
} as const;

export type AutomationConditionOperator =
  (typeof AUTOMATION_CONDITION_OPERATOR)[keyof typeof AUTOMATION_CONDITION_OPERATOR];

// ============================================================================
// AUTOMATION CONDITION SCHEMA (Embedded)
// ============================================================================

export const automationConditionSchema = v.object({
  operator: automationConditionOperatorSchema,
  value: v.optional(v.string()), // Not required for 'always' operator
  caseSensitive: v.optional(v.boolean()),
});

// ============================================================================
// AUTOMATION SCHEMAS
// ============================================================================

// Base automation schema without system fields
export const baseAutomationSchema = v.object({
  userId: v.id('users'),
  organizationId: v.optional(v.string()),
  socialProviderId: v.id('socialProviders'),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),

  // Trigger configuration
  triggerType: automationTriggerTypeSchema,

  // Target specific posts (required — must target specific posts)
  targetPostIds: v.array(v.string()),

  // Conditions (AND logic - all must match)
  conditions: v.array(automationConditionSchema),

  // DM template with {variables}
  messageTemplate: v.string(),

  // Stats (denormalized for quick access)
  totalTriggered: v.number(),
  totalDMsSent: v.number(),
  totalFailed: v.number(),

  createdAt: v.number(),
  updatedAt: v.number(),
});

// Automation schema with system fields (for returns)
export const automationSchema = v.object({
  _id: v.id('automations'),
  _creationTime: v.number(),
  ...baseAutomationSchema.fields,
});

export type Automation = Infer<typeof automationSchema>;

// Automation creation schema
export const automationCreateSchema = v.object({
  organizationId: v.optional(v.string()),
  socialProviderId: v.id('socialProviders'),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  triggerType: automationTriggerTypeSchema,
  targetPostIds: v.array(v.string()),
  conditions: v.array(automationConditionSchema),
  messageTemplate: v.string(),
});

// Automation update schema (partial)
export const automationUpdateSchema = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  triggerType: v.optional(automationTriggerTypeSchema),
  targetPostIds: v.optional(v.array(v.string())),
  conditions: v.optional(v.array(automationConditionSchema)),
  messageTemplate: v.optional(v.string()),
});

// ============================================================================
// AUTOMATION LOG SCHEMAS
// ============================================================================

// Base automation log schema — minimal, only log DM_SENT
export const baseAutomationLogSchema = v.object({
  automationId: v.id('automations'),
  userId: v.id('users'),
  instagramCommentId: v.string(),
  instagramUsername: v.optional(v.string()),
  status: v.literal('DM_SENT'),
  createdAt: v.number(),
});

// Automation log schema with system fields
export const automationLogSchema = v.object({
  _id: v.id('automationLogs'),
  _creationTime: v.number(),
  ...baseAutomationLogSchema.fields,
});

export type AutomationLog = Infer<typeof automationLogSchema>;

// ============================================================================
// DM PLAN LIMITS
// ============================================================================

export const DM_PLAN_LIMITS = {
  FREE: 100,
  VIBE: 5_000,
  ECHO: 50_000,
} as const;
