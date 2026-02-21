import { ConvexHttpClient } from "convex/browser";
import { env } from "@/env";

export const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
