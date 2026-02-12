import { type Infer, v } from "convex/values";

// ============================================================================
// AUTOMATION ENUMS
// ============================================================================

export const automationTriggerTypeSchema = v.union(
  v.literal("COMMENT"),
  v.literal("MENTION"),
  v.literal("STORY_REPLY")
);

export const AUTOMATION_TRIGGER_TYPE = {
  COMMENT: "COMMENT",
  MENTION: "MENTION",
  STORY_REPLY: "STORY_REPLY",
} as const;

export type AutomationTriggerType =
  (typeof AUTOMATION_TRIGGER_TYPE)[keyof typeof AUTOMATION_TRIGGER_TYPE];

export const automationConditionOperatorSchema = v.union(
  v.literal("contains"),
  v.literal("not_contains"),
  v.literal("equals"),
  v.literal("starts_with"),
  v.literal("ends_with"),
  v.literal("regex"),
  v.literal("always"),
  v.literal("is_follower"),
  v.literal("has_email")
);

export const AUTOMATION_CONDITION_OPERATOR = {
  CONTAINS: "contains",
  NOT_CONTAINS: "not_contains",
  EQUALS: "equals",
  STARTS_WITH: "starts_with",
  ENDS_WITH: "ends_with",
  REGEX: "regex",
  ALWAYS: "always",
  IS_FOLLOWER: "is_follower",
  HAS_EMAIL: "has_email",
} as const;

export type AutomationConditionOperator =
  (typeof AUTOMATION_CONDITION_OPERATOR)[keyof typeof AUTOMATION_CONDITION_OPERATOR];

// ============================================================================
// STEP-BASED FLOW SCHEMAS
// ============================================================================

// Comment reply options (random pick from list)
export const commentReplySchema = v.object({
  enabled: v.boolean(),
  replies: v.array(v.string()),
});

export type CommentReply = Infer<typeof commentReplySchema>;

// Keyword filter for triggers (merged into trigger, not a separate condition)
export const keywordFilterSchema = v.object({
  operator: automationConditionOperatorSchema,
  value: v.optional(v.string()),
  caseSensitive: v.optional(v.boolean()),
});

export type KeywordFilter = Infer<typeof keywordFilterSchema>;

// DM buttons
export const dmQuickReplySchema = v.object({
  type: v.literal("quick_reply"),
  title: v.string(), // max 20 chars
  payload: v.string(), // auto-generated ID for webhook identification
  nextStepId: v.optional(v.string()), // branch to next step when tapped
});

export const dmUrlButtonSchema = v.object({
  type: v.literal("url"),
  title: v.string(), // max 20 chars
  url: v.string(),
});

export const dmButtonSchema = v.union(dmQuickReplySchema, dmUrlButtonSchema);

export type DmButton = Infer<typeof dmButtonSchema>;

// Trigger step (multiple per automation, OR logic)
export const triggerStepSchema = v.object({
  id: v.string(),
  type: v.literal("trigger"),
  triggerType: automationTriggerTypeSchema,
  targetPostIds: v.array(v.string()),
  keywordFilter: v.optional(keywordFilterSchema),
  commentReply: v.optional(commentReplySchema),
  nextStepId: v.optional(v.string()),
});

export type TriggerStep = Infer<typeof triggerStepSchema>;

// Condition step
export const conditionStepSchema = v.object({
  id: v.string(),
  type: v.literal("condition"),
  operator: automationConditionOperatorSchema,
  value: v.optional(v.string()),
  caseSensitive: v.optional(v.boolean()),
  yesStepId: v.optional(v.string()),
  noStepId: v.optional(v.string()),
});

export type ConditionStep = Infer<typeof conditionStepSchema>;

// Send DM action step
export const sendDmStepSchema = v.object({
  id: v.string(),
  type: v.literal("send_dm"),
  messageTemplate: v.string(),
  buttons: v.optional(v.array(dmButtonSchema)), // max 13 quick replies
  commentReply: v.optional(commentReplySchema),
  nextStepId: v.optional(v.string()),
});

export type SendDmStep = Infer<typeof sendDmStepSchema>;

// Union of all non-trigger steps
export const automationStepSchema = v.union(
  conditionStepSchema,
  sendDmStepSchema
);

export type AutomationStep = Infer<typeof automationStepSchema>;

// Note (canvas annotation, no flow logic)
export const noteSchema = v.object({
  id: v.string(),
  content: v.string(),
  position: v.object({ x: v.number(), y: v.number() }),
});

export type Note = Infer<typeof noteSchema>;

// ============================================================================
// AUTOMATION SCHEMAS
// ============================================================================

// Base automation schema without system fields
export const baseAutomationSchema = v.object({
  userId: v.id("users"),
  organizationId: v.optional(v.string()),
  socialProviderId: v.id("socialProviders"),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.boolean(),

  // Step-based flow
  triggers: v.array(triggerStepSchema),
  steps: v.array(automationStepSchema),

  // Canvas annotations and layout
  notes: v.optional(v.array(noteSchema)),
  nodePositions: v.optional(v.any()), // Record<string, {x,y}> — stored as JSON blob

  // Stats (denormalized for quick access)
  totalTriggered: v.number(),
  totalDMsSent: v.number(),
  totalFailed: v.number(),

  createdAt: v.number(),
  updatedAt: v.number(),
});

// Automation schema with system fields (for returns)
export const automationSchema = v.object({
  _id: v.id("automations"),
  _creationTime: v.number(),
  ...baseAutomationSchema.fields,
});

export type Automation = Infer<typeof automationSchema>;

// Automation creation schema
export const automationCreateSchema = v.object({
  organizationId: v.optional(v.string()),
  socialProviderId: v.id("socialProviders"),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  triggers: v.array(triggerStepSchema),
  steps: v.array(automationStepSchema),
  notes: v.optional(v.array(noteSchema)),
  nodePositions: v.optional(v.any()),
});

// Automation update schema (partial)
export const automationUpdateSchema = v.object({
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  triggers: v.optional(v.array(triggerStepSchema)),
  steps: v.optional(v.array(automationStepSchema)),
  notes: v.optional(v.array(noteSchema)),
  nodePositions: v.optional(v.any()),
});

// ============================================================================
// AUTOMATION LOG SCHEMAS
// ============================================================================

// Base automation log schema — minimal, only log DM_SENT
export const baseAutomationLogSchema = v.object({
  automationId: v.id("automations"),
  userId: v.id("users"),
  instagramCommentId: v.string(),
  instagramUsername: v.optional(v.string()),
  status: v.literal("DM_SENT"),
  createdAt: v.number(),
});

// Automation log schema with system fields
export const automationLogSchema = v.object({
  _id: v.id("automationLogs"),
  _creationTime: v.number(),
  ...baseAutomationLogSchema.fields,
});

export type AutomationLog = Infer<typeof automationLogSchema>;

// ============================================================================
// AUTOMATION SESSION SCHEMAS
// ============================================================================

export const baseAutomationSessionSchema = v.object({
  automationId: v.id("automations"),
  userId: v.id("users"),
  instagramUserId: v.string(),
  instagramUsername: v.optional(v.string()),
  currentStepId: v.string(),
  triggerCommentId: v.optional(v.string()),
  triggerMediaId: v.optional(v.string()),
  status: v.union(
    v.literal("active"),
    v.literal("completed"),
    v.literal("expired")
  ),
  variables: v.optional(v.any()),
  lastActivityAt: v.number(),
  createdAt: v.number(),
});

export const automationSessionSchema = v.object({
  _id: v.id("automationSessions"),
  _creationTime: v.number(),
  ...baseAutomationSessionSchema.fields,
});

export type AutomationSession = Infer<typeof automationSessionSchema>;

// ============================================================================
// AUTOMATION CONTACT SCHEMAS
// ============================================================================

export const baseAutomationContactSchema = v.object({
  userId: v.id("users"),
  socialProviderId: v.id("socialProviders"),
  instagramUserId: v.string(),
  instagramUsername: v.optional(v.string()),
  email: v.optional(v.string()),
  collectedData: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const automationContactSchema = v.object({
  _id: v.id("automationContacts"),
  _creationTime: v.number(),
  ...baseAutomationContactSchema.fields,
});

export type AutomationContact = Infer<typeof automationContactSchema>;

// ============================================================================
// DM PLAN LIMITS
// ============================================================================

export const DM_PLAN_LIMITS = {
  FREE: 100,
  ECHO: -1, // Unlimited
  VIBE: 10_000,
} as const;
