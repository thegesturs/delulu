"use client";

import type { ReactNode } from "react";
import { AppStateProvider, ResourceBoundary } from "@/state/resources";
import { ApiClientProvider, useApiClient } from "./api-client";
import { WorkspaceProvider } from "./workspace";

function StateProviders({ children }: { readonly children: ReactNode }) {
  const { client } = useApiClient();
  return (
    <AppStateProvider client={client}>
      <ResourceBoundary
        fallback={
          <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </ResourceBoundary>
    </AppStateProvider>
  );
}

export function BackendProviders({ children }: { children: ReactNode }) {
  return (
    <ApiClientProvider>
      <StateProviders>{children}</StateProviders>
    </ApiClientProvider>
  );
}

import { Skeleton } from "@delulu/design-system/components/ui/skeleton";
