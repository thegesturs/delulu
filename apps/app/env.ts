import { keys as analytics } from '@delulu/analytics/keys';
import { keys as auth } from '@delulu/auth/keys';
import { keys as collaboration } from '@delulu/collaboration/keys';
import { keys as database } from '@delulu/database/keys';
import { keys as email } from '@delulu/email/keys';
import { keys as flags } from '@delulu/feature-flags/keys';
import { keys as core } from '@delulu/next-config/keys';
import { keys as notifications } from '@delulu/notifications/keys';
import { keys as observability } from '@delulu/observability/keys';
import { keys as security } from '@delulu/security/keys';
import { keys as webhooks } from '@delulu/webhooks/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    collaboration(),
    core(),
    database(),
    email(),
    flags(),
    notifications(),
    observability(),
    security(),
    webhooks(),
    // payments(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
