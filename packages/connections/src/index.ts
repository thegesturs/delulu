/**
 * Isomorphic entry (`@delulu/connections`) — safe to import from Cloudflare
 * Workers (tRPC, OAuth callbacks, composer). Exposes meta / auth / rules /
 * settings / webhooks / queries + the token service. Does NOT export publishing
 * (axios/googleapis) — use `@delulu/connections/worker` for that.
 */

export * from "./errors";
export { connectFacebookPage } from "./platforms/facebook/auth";
export {
  connectionRegistry,
  getAllCharacterLimits,
  getAllMediaRules,
  getConnection,
  listConnections,
  listPublishable,
} from "./registry";
export {
  ConnectionStore,
  type SocialProviderTokens,
  type SocialProviderUpdate,
} from "./services/connection-store";
export { ensureFreshToken } from "./services/token-service";
export * from "./types";
