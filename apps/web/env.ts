import { keys as cms } from '@delulu/cms/keys';
import { keys as email } from '@delulu/email/keys';
import { keys as flags } from '@delulu/feature-flags/keys';
import { keys as core } from '@delulu/next-config/keys';
import { keys as observability } from '@delulu/observability/keys';
import { keys as rateLimit } from '@delulu/rate-limit/keys';
import { keys as security } from '@delulu/security/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    cms(),
    core(),
    email(),
    observability(),
    flags(),
    security(),
    rateLimit(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
