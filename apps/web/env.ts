import { keys as analytics } from "@delulu/analytics/keys";
import { keys as email } from "@delulu/email/keys";
import { keys as core } from "@delulu/next-config/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  extends: [core(), email(), analytics()],
  server: {},
  client: {
    NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
});
