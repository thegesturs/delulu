export * from "./admin.js";
export * from "./analytics.js";
export * from "./automations.js";
export * from "./billing.js";
export * from "./connections.js";
export * from "./health.js";
export * from "./me.js";
export * from "./media.js";
export * from "./posts.js";
export * from "./reviews.js";
export * from "./shared.js";

import { createAdminOptions } from "./admin.js";
import { createAnalyticsOptions } from "./analytics.js";
import { createAutomationOptions } from "./automations.js";
import { createBillingOptions } from "./billing.js";
import { createConnectionOptions } from "./connections.js";
import { createHealthOptions } from "./health.js";
import { createMeOptions } from "./me.js";
import { createMediaOptions } from "./media.js";
import { createPostOptions } from "./posts.js";
import { createReviewOptions } from "./reviews.js";
import { defineResourceOptions } from "./shared.js";

/** Current contract-backed options. New M3/M4 modules compose beside these. */
export const createResourceOptions = defineResourceOptions((runtime) => ({
  health: createHealthOptions(runtime),
  me: createMeOptions(runtime),
  posts: createPostOptions(runtime),
  reviews: createReviewOptions(runtime),
  media: createMediaOptions(runtime),
  connections: createConnectionOptions(runtime),
  admin: createAdminOptions(runtime),
  analytics: createAnalyticsOptions(runtime),
  automations: createAutomationOptions(runtime),
  billing: createBillingOptions(runtime),
}));
