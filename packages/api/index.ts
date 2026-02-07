import "server-only";

import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import type { AppRouter } from "./root";
import { appRouter } from "./root";
import { createCallerFactory, createTRPCContext } from "./trpc";

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
const createCaller = createCallerFactory(appRouter);

/**
 * Inference helpers for input types
 * @example
 * type PostByIdInput = RouterInputs['post']['byId']
 *      ^? { id: number }
 */
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type AllPostsOutput = RouterOutputs['post']['all']
 *      ^? Post[]
 */
type RouterOutputs = inferRouterOutputs<AppRouter>;

export {
  createTRPCContext,
  appRouter,
  createCaller,
  superjson,
  fetchRequestHandler,
};
export type { AppRouter, RouterInputs, RouterOutputs };
