import { getCloudflareContext } from "@opennextjs/cloudflare";

// Re-export generated Cloudflare types
// Import the global declarations from the generated file
import "./cloudflare-env";

// Re-export the CloudflareEnv type from the global namespace
export type CloudflareEnv = globalThis.CloudflareEnv;

/**
 * Get Cloudflare environment variables asynchronously
 * Uses getCloudflareContext internally for reliable access
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  const context = await getCloudflareContext<IncomingRequestCfProperties<unknown>, ExecutionContext>({ 
    async: true 
  });
  return context.env;
}

/**
 * Get Cloudflare environment variables synchronously
 * Uses getCloudflareContext internally for reliable access
 */
export function getCloudflareEnvSync(): CloudflareEnv {
  const context = getCloudflareContext<IncomingRequestCfProperties<unknown>, ExecutionContext>();
  return context.env;
}

/**
 * Get full Cloudflare context asynchronously
 * Provides access to env, cf, ctx, and other context properties
 */
export async function getCloudflareCtx() {
  return await getCloudflareContext<IncomingRequestCfProperties<unknown>, ExecutionContext>({ 
    async: true 
  });
}

/**
 * Get full Cloudflare context synchronously
 * Provides access to env, cf, ctx, and other context properties
 */
export function getCloudflareCtxSync() {
  return getCloudflareContext<IncomingRequestCfProperties<unknown>, ExecutionContext>();
}