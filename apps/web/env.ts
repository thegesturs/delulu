import { keys as analytics } from "@delulu/analytics/keys";
import { keys as email } from "@delulu/email/keys";
import { keys as core } from "@delulu/next-config/keys";
import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  extends: [core(), email(), analytics()],
  server: {},
  client: {},
  runtimeEnv: {},
});
