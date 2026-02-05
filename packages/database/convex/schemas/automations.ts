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

export const automationLogStatusSchema = v.union(
  v.literal('TRIGGERED'),
  v.literal('DM_SENT'),
  v.literal('DM_FAILED'),
  v.literal('RATE_LIMITED'),
  v.literal('CONDITION_NOT_MET'),
  v.literal('DUPLICATE')
);

export const AUTOMATION_LOG_STATUS = {
  TRIGGERED: 'TRIGGERED',
  DM_SENT: 'DM_SENT',
  DM_FAILED: 'DM_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  CONDITION_NOT_MET: 'CONDITION_NOT_MET',
  DUPLICATE: 'DUPLICATE',
} as const;

export type AutomationLogStatus =
  (typeof AUTOMATION_LOG_STATUS)[keyof typeof AUTOMATION_LOG_STATUS];

export const webhookEventStatusSchema = v.union(
  v.literal('RECEIVED'),
  v.literal('PROCESSING'),
  v.literal('PROCESSED'),
  v.literal('FAILED')
);

export const WEBHOOK_EVENT_STATUS = {
  RECEIVED: 'RECEIVED',
  PROCESSING: 'PROCESSING',
  PROCESSED: 'PROCESSED',
  FAILED: 'FAILED',
} as const;

export type WebhookEventStatus =
  (typeof WEBHOOK_EVENT_STATUS)[keyof typeof WEBHOOK_EVENT_STATUS];

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

  // Optional: target specific posts (empty = all posts)
  targetPostIds: v.optional(v.array(v.string())),

  // Conditions (AND logic - all must match)
  conditions: v.array(automationConditionSchema),

  // DM template with {variables}
  messageTemplate: v.string(),

  // Rate limiting
  maxDMsPerHour: v.number(),
  maxDMsPerDay: v.number(),
  cooldownMinutes: v.optional(v.number()), // Min time between DMs to same user

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
  targetPostIds: v.optional(v.array(v.string())),
  conditions: v.array(automationConditionSchema),
  messageTemplate: v.string(),
  maxDMsPerHour: v.optional(v.number()),
  maxDMsPerDay: v.optional(v.number()),
  cooldownMinutes: v.optional(v.number()),
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
  maxDMsPerHour: v.optional(v.number()),
  maxDMsPerDay: v.optional(v.number()),
  cooldownMinutes: v.optional(v.number()),
});

// ============================================================================
// AUTOMATION LOG SCHEMAS
// ============================================================================

// Base automation log schema without system fields
export const baseAutomationLogSchema = v.object({
  automationId: v.id('automations'),
  userId: v.id('users'),

  // Event details from Instagram
  instagramCommentId: v.string(),
  instagramUserId: v.string(),
  instagramUsername: v.optional(v.string()),
  instagramMediaId: v.optional(v.string()), // The post that was commented on
  commentText: v.optional(v.string()),

  // Processing result
  status: automationLogStatusSchema,

  // DM details (if sent)
  dmMessageSent: v.optional(v.string()),
  instagramDMId: v.optional(v.string()),

  // Error details (if failed)
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),

  // Processing metadata
  processingTimeMs: v.optional(v.number()),

  createdAt: v.number(),
});

// Automation log schema with system fields
export const automationLogSchema = v.object({
  _id: v.id('automationLogs'),
  _creationTime: v.number(),
  ...baseAutomationLogSchema.fields,
});

export type AutomationLog = Infer<typeof automationLogSchema>;

// Automation log creation schema
export const automationLogCreateSchema = v.object({
  automationId: v.id('automations'),
  instagramCommentId: v.string(),
  instagramUserId: v.string(),
  instagramUsername: v.optional(v.string()),
  instagramMediaId: v.optional(v.string()),
  commentText: v.optional(v.string()),
  status: automationLogStatusSchema,
  dmMessageSent: v.optional(v.string()),
  instagramDMId: v.optional(v.string()),
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  processingTimeMs: v.optional(v.number()),
});

// ============================================================================
// WEBHOOK EVENT SCHEMAS
// ============================================================================

// Base webhook event schema without system fields
export const baseWebhookEventSchema = v.object({
  eventId: v.string(), // Unique ID from Instagram or generated
  platform: v.string(), // 'instagram', 'facebook', etc.
  eventType: v.string(), // 'comments', 'mentions', etc.
  rawPayload: v.string(), // JSON stringified payload
  status: webhookEventStatusSchema,
  retryCount: v.number(),
  processedAt: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  receivedAt: v.number(),
});

// Webhook event schema with system fields
export const webhookEventSchema = v.object({
  _id: v.id('webhookEvents'),
  _creationTime: v.number(),
  ...baseWebhookEventSchema.fields,
});

export type WebhookEvent = Infer<typeof webhookEventSchema>;

// Webhook event creation schema
export const webhookEventCreateSchema = v.object({
  eventId: v.string(),
  platform: v.string(),
  eventType: v.string(),
  rawPayload: v.string(),
  status: v.optional(webhookEventStatusSchema),
  retryCount: v.optional(v.number()),
});

// Webhook event update schema
export const webhookEventUpdateSchema = v.object({
  status: v.optional(webhookEventStatusSchema),
  retryCount: v.optional(v.number()),
  processedAt: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
});
