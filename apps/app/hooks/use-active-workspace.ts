"use client";

import { useWorkspace } from "@/components/providers/workspace";

/** Resolves the application-wide selected API workspace. */
export function useActiveWorkspace() {
  const selected = useWorkspace();
  const workspace = selected.workspaces.find(
    (candidate) => candidate.workspaceId === selected.workspaceId
  );

  return {
    workspace,
    workspaceId: selected.workspaceId ?? undefined,
    isPending: selected.isLoading,
    isError: selected.isError,
    error: selected.error,
    refetch: selected.refetch,
  };
}
