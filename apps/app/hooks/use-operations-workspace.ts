"use client";

import { useOrganization } from "@delulu/auth";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/components/providers/api-client";

/** Resolve the backend workspace that corresponds to the active Clerk context. */
export function useOperationsWorkspace() {
  const { organization, isLoaded } = useOrganization();
  const { resources } = useApiClient();
  const membershipOptions = resources.me.workspaces();
  const memberships = useQuery({
    ...membershipOptions,
    queryKey: membershipOptions.queryKey!,
  });

  const organizationWorkspaces = memberships.data?.data.filter(
    (candidate) => !candidate.isPersonal
  );
  const workspace = organization
    ? (organizationWorkspaces?.find(
        (candidate) =>
          candidate.slug === organization.slug ||
          candidate.name === organization.name
      ) ??
      (organizationWorkspaces?.length === 1
        ? organizationWorkspaces[0]
        : undefined))
    : memberships.data?.data.find((candidate) => candidate.isPersonal);
  const selectionError =
    isLoaded && !memberships.isPending && !memberships.error && !workspace
      ? new Error(
          "The active organization could not be matched to a backend workspace"
        )
      : null;

  return {
    workspace,
    workspaceId: workspace?.workspaceId,
    isLoading: !isLoaded || memberships.isPending,
    error: memberships.error ?? selectionError,
    retry: memberships.refetch,
  };
}
