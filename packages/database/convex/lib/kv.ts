/**
 * Minimal Cloudflare Workers KV REST client for use from Convex actions.
 *
 * Only used by the trigger cache path. All calls are best-effort — the DB is
 * the source of truth; KV is a presence cache for the IG webhook fast-path.
 *
 * Env vars (set via `npx convex env set`):
 *   CF_ACCOUNT_ID            Cloudflare account id
 *   CF_KV_NAMESPACE_ID       Namespace id (can reuse DELULU_RATE_LIMIT_KV)
 *   CF_KV_API_TOKEN          Token scoped to "Workers KV Storage: Edit"
 */

function kvConfig() {
  const accountId = process.env.CF_ACCOUNT_ID;
  const namespaceId = process.env.CF_KV_NAMESPACE_ID;
  const token = process.env.CF_KV_API_TOKEN;
  if (!(accountId && namespaceId && token)) {
    return null;
  }
  return {
    baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`,
    token,
  };
}

function encodeKey(key: string): string {
  return encodeURIComponent(key);
}

/**
 * Put a key with a short string value. No-op if CF_* env vars are unset.
 * Returns true on success, false on failure or unconfigured.
 */
export async function kvPut(
  key: string,
  value: string,
  opts?: { expirationTtlSeconds?: number }
): Promise<boolean> {
  const cfg = kvConfig();
  if (!cfg) {
    return false;
  }
  const qs = opts?.expirationTtlSeconds
    ? `?expiration_ttl=${opts.expirationTtlSeconds}`
    : "";
  try {
    const res = await fetch(`${cfg.baseUrl}/values/${encodeKey(key)}${qs}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "text/plain",
      },
      body: value,
    });
    if (!res.ok) {
      console.warn(`[kv] PUT ${key} failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(
      `[kv] PUT ${key} threw: ${e instanceof Error ? e.message : e}`
    );
    return false;
  }
}

/**
 * Delete a key. No-op if CF_* env vars are unset. Treats 404 as success.
 */
export async function kvDelete(key: string): Promise<boolean> {
  const cfg = kvConfig();
  if (!cfg) {
    return false;
  }
  try {
    const res = await fetch(`${cfg.baseUrl}/values/${encodeKey(key)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!res.ok && res.status !== 404) {
      console.warn(`[kv] DELETE ${key} failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn(
      `[kv] DELETE ${key} threw: ${e instanceof Error ? e.message : e}`
    );
    return false;
  }
}

/**
 * Standard key format for the IG webhook trigger presence cache.
 */
export function triggerKey(profileId: string, mediaId: string): string {
  return `trig:${profileId}:${mediaId}`;
}
