"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApiClient } from "@/components/providers/api-client";
import { useResourceRegistry } from "@/state/resources";

export type ConnectionSyncStatus = "idle" | "syncing" | "ready" | "error";

const CONNECTION_LIST_LIMIT = 100;
const RECONCILE_DELAYS_MS = [0, 150, 300, 600, 1200] as const;
const LEADING_AT = /^@/;

export const connectionIsVisible = (
  accounts: readonly {
    readonly platform: string;
    readonly profileId: string;
    readonly username: string | null;
    readonly displayName: string | null;
  }[],
  provider: string,
  callbackProfileId: string | null,
  callbackUsername: string | null
) => {
  const expected = callbackUsername?.replace(LEADING_AT, "").toLowerCase();
  return accounts.some((account) => {
    if (account.platform.toLowerCase() !== provider.toLowerCase()) {
      return false;
    }
    if (callbackProfileId) {
      return account.profileId === callbackProfileId;
    }
    if (!expected) {
      return true;
    }
    return [account.username, account.displayName].some(
      (value) => value?.replace(LEADING_AT, "").toLowerCase() === expected
    );
  });
};

export function useConnectionReconciliation(input: {
  readonly enabled: boolean;
  readonly provider: string | null;
  readonly callbackProfileId: string | null;
  readonly callbackUsername: string | null;
  readonly workspaceId: string | null | undefined;
}) {
  const { resources } = useApiClient();
  const registry = useResourceRegistry();
  const [status, setStatus] = useState<ConnectionSyncStatus>(
    input.enabled ? "syncing" : "idle"
  );
  const reconcileKeyRef = useRef<string | null>(null);

  const fetchUntilVisible = useCallback(async () => {
    if (!(input.provider && input.workspaceId)) {
      return false;
    }
    const descriptor = resources.connections.list(input.workspaceId, {
      limit: CONNECTION_LIST_LIMIT,
    });
    for (const delayMs of RECONCILE_DELAYS_MS) {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      try {
        const page = await registry.fetchResource(descriptor);
        if (
          connectionIsVisible(
            page.data,
            input.provider,
            input.callbackProfileId,
            input.callbackUsername
          )
        ) {
          return true;
        }
      } catch {
        // The callback has already persisted the authorization. Retry transient
        // read failures briefly while keeping the user informed.
      }
    }
    return false;
  }, [
    input.provider,
    input.callbackProfileId,
    input.workspaceId,
    input.callbackUsername,
    registry,
    resources,
  ]);

  useEffect(() => {
    if (!(input.enabled && input.provider && input.workspaceId)) {
      return;
    }
    const reconcileKey = `${input.workspaceId}:${input.provider}:${input.callbackProfileId ?? ""}:${input.callbackUsername ?? ""}`;
    if (reconcileKeyRef.current === reconcileKey) {
      return;
    }
    reconcileKeyRef.current = reconcileKey;
    let cancelled = false;
    setStatus("syncing");
    fetchUntilVisible()
      .then((visible) => {
        if (!cancelled) {
          setStatus(visible ? "ready" : "error");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    input.enabled,
    input.provider,
    input.callbackProfileId,
    input.workspaceId,
    input.callbackUsername,
    fetchUntilVisible,
  ]);

  const retry = useCallback(async () => {
    setStatus("syncing");
    const visible = await fetchUntilVisible();
    setStatus(visible ? "ready" : "error");
  }, [fetchUntilVisible]);

  return { status, retry } as const;
}
