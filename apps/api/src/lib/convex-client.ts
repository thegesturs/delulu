import { ConvexHttpClient } from "convex/browser";
import type { Env } from "../types";

export function createConvexClient(env: Env) {
  return new ConvexHttpClient(env.CONVEX_URL);
}
