// Re-export for convenience
export type {
  AutomationConditionOperator,
  AutomationStep,
  AutomationTriggerType,
  CommentReply,
  ConditionStep,
  DelayStep,
  DmButton,
  KeywordFilter,
  Note,
  SendDmStep,
  TriggerStep,
} from "@delulu/database/convex/schemas/automations";

export interface AutomationMeta {
  name: string;
  description: string;
  isActive: boolean;
  socialProviderId: string;
}
