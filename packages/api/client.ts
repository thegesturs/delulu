import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export { superjson } from "superjson";
export type { AppRouter } from "./root";

/**
 * Inference helpers for input/output types
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
