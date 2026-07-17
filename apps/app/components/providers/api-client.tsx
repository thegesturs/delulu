"use client";

import { useAuth } from "@delulu/auth";
import {
  type ApiClient,
  createApiClient,
  createResourceEffects,
} from "@delulu/client";
import { createContext, type ReactNode, useContext, useMemo } from "react";

type ResourceEffects = ReturnType<typeof createResourceEffects>;

interface ApiClientContextValue {
  readonly client: ApiClient;
  readonly resources: ResourceEffects;
}

const ApiClientContext = createContext<ApiClientContextValue | null>(null);

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8788"
    : "https://api.delulu.social");

export function ApiClientProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { getToken } = useAuth();

  const value = useMemo<ApiClientContextValue>(() => {
    if (!apiBaseUrl) {
      throw new Error("Missing NEXT_PUBLIC_API_URL");
    }

    const client = createApiClient({
      baseUrl: apiBaseUrl,
      getToken: async () => {
        const token = await getToken();
        if (!token) {
          throw new Error("No authenticated API token is available");
        }
        return token;
      },
    });

    return {
      client,
      resources: createResourceEffects({ client }),
    };
  }, [getToken]);

  return (
    <ApiClientContext.Provider value={value}>
      {children}
    </ApiClientContext.Provider>
  );
}

export const useApiClient = (): ApiClientContextValue => {
  const value = useContext(ApiClientContext);
  if (!value) {
    throw new Error("useApiClient must be used within ApiClientProvider");
  }
  return value;
};
