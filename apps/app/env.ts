import { keys as analytics } from "@delulu/analytics/keys";
import { keys as collaboration } from "@delulu/collaboration/keys";
// import { keys as email } from '@delulu/email/keys';
// import { keys as flags } from '@delulu/feature-flags/keys';
import { keys as core } from "@delulu/next-config/keys";
// import { keys as notifications } from '@delulu/notifications/keys';
// import { keys as observability } from '@delulu/observability/keys';
import { keys as payments } from "@delulu/payments/keys";
import { keys as security } from "@delulu/security/keys";
// import { keys as webhooks } from '@delulu/webhooks/keys';
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  extends: [
    analytics(),
    collaboration(),
    core(),
    // email(),
    // flags(),
    // notifications(),
    // observability(),
    payments(),
    security(),
    // webhooks(),
  ],
  server: {
    PORT: z.number().default(3000),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    PORT: 3000,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
});
