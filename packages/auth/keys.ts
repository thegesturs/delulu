import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      GOOGLE_CLIENT_ID: z.string(),
      GOOGLE_CLIENT_SECRET: z.string(),
      RESEND_TOKEN: z.string(),
    },
    runtimeEnv: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      RESEND_TOKEN: process.env.RESEND_TOKEN,
    },
    skipValidation: true,
  });
