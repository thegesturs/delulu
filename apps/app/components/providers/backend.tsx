"use client";

import type { ReactNode } from "react";
import { ApiClientProvider } from "./api-client";
import { AppQueryClientProvider } from "./query-client";
import { WorkspaceProvider } from "./workspace";

export function BackendProviders({ children }: { children: ReactNode }) {
  return (
    <AppQueryClientProvider>
      <ApiClientProvider>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </ApiClientProvider>
    </AppQueryClientProvider>
  );
}
