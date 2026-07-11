"use client";

import { useOrganization } from "@delulu/auth";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/components/providers/api-client";

/** Resolves the selected identity-provider organization to its API workspace. */
export function useActiveWorkspace() {
  const { organization, isLoaded } = useOrganization();
  const { resources } = useApiClient();
  const workspaces = useQuery({
    ...resources.me.workspaces(),
    enabled: isLoaded,
    staleTime: 60_000,
    retry: 2,
  });

  const workspace = workspaces.data?.data.find((candidate) =>
    organization ? candidate.slug === organization.slug : candidate.isPersonal,
  );

  return {
    ...workspaces,
    workspace,
    workspaceId: workspace?.workspaceId,
    isPending: !isLoaded || workspaces.isPending,
  };
}
