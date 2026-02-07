import type {
  AutomationConditionOperator,
  AutomationStep,
  AutomationTriggerType,
  CommentReply,
  ConditionStep,
  DmButton,
  SendDmStep,
  TriggerStep,
} from "@delulu/database/convex/schemas/automations";

// Re-export for convenience
export type {
  AutomationStep,
  ConditionStep,
  DmButton,
  CommentReply,
  SendDmStep,
  TriggerStep,
  AutomationTriggerType,
  AutomationConditionOperator,
};

export interface AutomationMeta {
  name: string;
  description: string;
  isActive: boolean;
  socialProviderId: string;
}
