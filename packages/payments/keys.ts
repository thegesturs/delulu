import { createEnv } from '@t3-oss/env-nextjs';

export const keys = () =>
  createEnv({
    server: {
      // DODO_PAYMENTS_API_KEY: z.string().min(1),
      // DODO_PAYMENTS_ENVIRONMENT: z.enum(['test_mode', 'live_mode']).default('test_mode'),
      // DODO_PAYMENTS_WEBHOOK_SECRET: z.string().min(1).optional(),
    },
    client: {
      // NEXT_PUBLIC_DODO_PAYMENTS_PUBLIC_KEY: z.string().min(1).optional(),
    },
    runtimeEnv: {
      // DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
      // DODO_PAYMENTS_ENVIRONMENT: process.env.DODO_PAYMENTS_ENVIRONMENT,
      // DODO_PAYMENTS_WEBHOOK_SECRET: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
      // NEXT_PUBLIC_DODO_PAYMENTS_PUBLIC_KEY: process.env.NEXT_PUBLIC_DODO_PAYMENTS_PUBLIC_KEY,
    },
  });
