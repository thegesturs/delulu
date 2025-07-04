import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      GOOGLE_CLIENT_ID: z.string(),
      GOOGLE_CLIENT_SECRET: z.string(),
      RESEND_TOKEN: z.string(),
      BETTER_AUTH_SECRET: z.string().min(1),
    },
    runtimeEnv: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      RESEND_TOKEN: process.env.RESEND_TOKEN,
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    },
    skipValidation: true,
  });
