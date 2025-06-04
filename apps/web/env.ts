import { keys as email } from '@delulu/email/keys';
import { keys as core } from '@delulu/next-config/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    core(),
    email(),
    // observability(),
    // flags(),
    // security(),
    // rateLimit(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
