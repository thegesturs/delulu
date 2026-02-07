import type {
  ExecutionContext,
  IncomingRequestCfProperties,
} from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "./types";

export type { R2Bucket } from "@cloudflare/workers-types";
// Export CloudflareEnv type
export type { CloudflareEnv } from "./types";

/**
 * Get Cloudflare environment variables asynchronously
 * Uses getCloudflareContext internally for reliable access
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  const context = await getCloudflareContext<
    IncomingRequestCfProperties<unknown>,
    ExecutionContext
  >({
    async: true,
  });
  return context.env as unknown as CloudflareEnv;
}

/**
 * Get Cloudflare environment variables synchronously
 * Uses getCloudflareContext internally for reliable access
 */
export function getCloudflareEnvSync(): CloudflareEnv {
  const context = getCloudflareContext<
    IncomingRequestCfProperties<unknown>,
    ExecutionContext
  >();
  return context.env as unknown as CloudflareEnv;
}

/**
 * Get full Cloudflare context asynchronously
 * Provides access to env, cf, ctx, and other context properties
 */
export async function getCloudflareCtx() {
  return await getCloudflareContext<
    IncomingRequestCfProperties<unknown>,
    ExecutionContext
  >({
    async: true,
  });
}

/**
 * Get full Cloudflare context synchronously
 * Provides access to env, cf, ctx, and other context properties
 */
export function getCloudflareCtxSync() {
  return getCloudflareContext<
    IncomingRequestCfProperties<unknown>,
    ExecutionContext
  >();
}
