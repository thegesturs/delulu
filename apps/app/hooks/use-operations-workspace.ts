"use client";

import { useWorkspace } from "@/components/providers/workspace";

/** Resolve operations pages through the application-wide workspace selection. */
export function useOperationsWorkspace() {
  const selected = useWorkspace();
  const workspace = selected.workspaces.find(
    (candidate) => candidate.workspaceId === selected.workspaceId
  );
  const selectionError =
    selected.isLoading || selected.error || workspace
      ? null
      : new Error("Select a workspace to continue");

  return {
    workspace,
    workspaceId: workspace?.workspaceId,
    isLoading: selected.isLoading,
    error: selected.error ?? selectionError,
    retry: selected.refetch,
  };
}
