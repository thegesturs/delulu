"use client";

import { useOrganization } from "@delulu/auth";
import type { AutomationScope } from "@delulu/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useApiClient } from "@/components/providers/api-client";
import type {
  AutomationStep,
  Note,
  TriggerStep,
} from "./flow-builder/utils/flow-types";

export const AUTOMATION_PLATFORM = "instagram" as const;
export const AUTOMATION_CATEGORY = "dm";

export interface AutomationResourceView {
  readonly id: string;
  readonly workspaceId: string;
  readonly connectionId: string;
  readonly platform: string;
  readonly category: string;
  readonly name: string;
  readonly description: string | null;
  readonly enabled: boolean;
  readonly triggers: TriggerStep[];
  readonly steps: AutomationStep[];
  readonly notes: Note[];
  readonly nodePositions: Readonly<
    Record<string, { readonly x: number; readonly y: number }>
  >;
  readonly totalTriggered: number;
  readonly totalDmsSent: number;
  readonly totalFailed: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type ResourceTrigger = Omit<TriggerStep, "triggerType"> & {
  readonly triggerType: "comment" | "mention" | "story_reply";
};

interface ResourceAutomationShape
  extends Omit<AutomationResourceView, "triggers"> {
  readonly triggers: readonly ResourceTrigger[];
}

const triggerFromResource = (
  triggerType: ResourceTrigger["triggerType"]
): TriggerStep["triggerType"] => {
  switch (triggerType) {
    case "mention":
      return "MENTION";
    case "story_reply":
      return "STORY_REPLY";
    default:
      return "COMMENT";
  }
};

const triggerToResource = (
  triggerType: TriggerStep["triggerType"]
): ResourceTrigger["triggerType"] => {
  switch (triggerType) {
    case "MENTION":
      return "mention";
    case "STORY_REPLY":
      return "story_reply";
    default:
      return "comment";
  }
};

export const automationFromResource = (
  input: unknown
): AutomationResourceView => {
  const automation = input as ResourceAutomationShape;
  return {
    ...automation,
    triggers: automation.triggers.map((trigger) => ({
      ...trigger,
      targetPostIds: [...trigger.targetPostIds],
      pendingPostIds: trigger.pendingPostIds
        ? [...trigger.pendingPostIds]
        : undefined,
      triggerType: triggerFromResource(trigger.triggerType),
    })),
    steps: [...automation.steps],
    notes: [...automation.notes],
  };
};

export const triggersToResource = (triggers: readonly TriggerStep[]) =>
  triggers.map((trigger) => ({
    ...trigger,
    triggerType: triggerToResource(trigger.triggerType),
  }));

export type ApiErrorKind =
  | "permission"
  | "not-found"
  | "validation"
  | "conflict"
  | "transport";

export interface ApiErrorDetails {
  readonly kind: ApiErrorKind;
  readonly message: string;
}

export const getApiErrorDetails = (error: unknown): ApiErrorDetails => {
  const tagged = error as { readonly _tag?: string; readonly message?: string };
  const message =
    tagged.message ??
    (error instanceof Error
      ? error.message
      : "The request could not be completed");

  switch (tagged._tag) {
    case "ForbiddenError":
    case "UnauthorizedError":
      return { kind: "permission", message };
    case "NotFoundError":
      return { kind: "not-found", message };
    case "ValidationError":
      return { kind: "validation", message };
    case "ConflictError":
      return { kind: "conflict", message };
    default:
      return { kind: "transport", message };
  }
};

export function useAutomationWorkspace() {
  const { organization } = useOrganization();
  const { resources } = useApiClient();
  const workspacesOptions = useMemo(
    () => resources.me.workspaces(),
    [resources]
  );
  const workspacesQuery = useQuery({
    ...workspacesOptions,
    queryKey: workspacesOptions.queryKey!,
  });

  const workspace = useMemo(() => {
    const workspaces = workspacesQuery.data?.data ?? [];
    if (organization) {
      return workspaces.find(
        (candidate) =>
          (organization.slug && candidate.slug === organization.slug) ||
          candidate.name === organization.name
      );
    }
    return (
      workspaces.find((candidate) => candidate.isPersonal) ?? workspaces[0]
    );
  }, [organization, workspacesQuery.data]);

  const scope = useMemo<AutomationScope | undefined>(
    () =>
      workspace
        ? {
            workspaceId: workspace.workspaceId,
            platform: AUTOMATION_PLATFORM,
            category: AUTOMATION_CATEGORY,
          }
        : undefined,
    [workspace]
  );

  return { ...workspacesQuery, scope, workspaceId: workspace?.workspaceId };
}
