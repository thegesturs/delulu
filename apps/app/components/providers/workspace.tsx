"use client";

import { useAtomValue } from "@effect/atom-react";
import { Atom } from "effect/unstable/reactivity";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { appRegistry, useResourceAtom } from "@/state/resources";
import { useApiClient } from "./api-client";

const STORAGE_KEY = "delulu.workspaceId";

interface WorkspaceContextValue {
  readonly workspaceId: string | null;
  readonly workspaces: readonly {
    readonly workspaceId: string;
    readonly name: string;
    readonly slug: string | null;
    readonly isPersonal: boolean;
    readonly role: "owner" | "admin" | "editor" | "viewer";
  }[];
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly refetch: () => Promise<unknown>;
  readonly selectWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const selectedWorkspaceAtom = Atom.make<string | null>(null).pipe(
  Atom.keepAlive
);

export function WorkspaceProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { resources } = useApiClient();
  const memberships = useResourceAtom(resources.me.workspaces());
  const selected = useAtomValue(selectedWorkspaceAtom);
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const workspaces = memberships.data?.data ?? [];

  useEffect(() => {
    const persisted = localStorage.getItem(STORAGE_KEY);
    if (persisted) {
      appRegistry.set(selectedWorkspaceAtom, persisted);
    }
    setSelectionHydrated(true);
  }, []);

  useEffect(() => {
    if (!selectionHydrated || workspaces.length === 0) {
      return;
    }
    if (selected && workspaces.some((item) => item.workspaceId === selected)) {
      return;
    }
    const fallback = workspaces[0]?.workspaceId ?? null;
    appRegistry.set(selectedWorkspaceAtom, fallback);
    if (fallback) {
      localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [selected, selectionHydrated, workspaces]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaceId: selected,
      workspaces,
      isLoading: memberships.isPending,
      isError: memberships.isError,
      error: memberships.error,
      refetch: memberships.refetch,
      selectWorkspace: (workspaceId) => {
        if (!workspaces.some((item) => item.workspaceId === workspaceId)) {
          return;
        }
        localStorage.setItem(STORAGE_KEY, workspaceId);
        appRegistry.set(selectedWorkspaceAtom, workspaceId);
      },
    }),
    [
      memberships.error,
      memberships.isError,
      memberships.isPending,
      memberships.refetch,
      selected,
      workspaces,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = (): WorkspaceContextValue => {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return value;
};
