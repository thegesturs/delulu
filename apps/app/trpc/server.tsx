import type { AppRouter } from '@delulu/api';
import { appRouter, createTRPCContext } from '@delulu/api';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import type { TRPCQueryOptions } from '@trpc/tanstack-react-query';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { headers } from 'next/headers';
import { cache } from 'react';
// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';

import { createQueryClient } from './query-client';

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set('x-trpc-source', 'rsc');

  return createTRPCContext({
    headers: heads,
  });
});

const getQueryClient = cache(createQueryClient);

export const api = createTRPCOptionsProxy<AppRouter>({
  router: appRouter,
  ctx: createContext,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    // biome-ignore lint/complexity/noVoid: <explanation>
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    // biome-ignore lint/complexity/noVoid: <explanation>
    void queryClient.prefetchQuery(queryOptions);
  }
}
