/**
 * Convex → Hono Worker bridge for outbound email notifications.
 *
 * All external email sending lives in the apps/api Worker (see
 * /v1/notifications/*). Convex internalActions call this helper to POST
 * to the Worker with a shared secret. Failures are logged but never
 * rethrown — email is best-effort and must never block primary flows.
 */
export async function postNotification(
  path:
    | "/v1/notifications/post-review-requested"
    | "/v1/notifications/post-publish-failed"
    | "/v1/notifications/welcome",
  body: Record<string, unknown>
): Promise<void> {
  const baseUrl = process.env.DELULU_API_URL;
  const secret = process.env.INTERNAL_NOTIFICATIONS_SECRET;

  if (!baseUrl) {
    console.warn(
      `[Email] DELULU_API_URL not set — skipping ${path} notification`
    );
    return;
  }
  if (!secret) {
    console.warn(
      `[Email] INTERNAL_NOTIFICATIONS_SECRET not set — skipping ${path} notification`
    );
    return;
  }

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[Email] ${path} failed status=${response.status} body=${text}`
      );
      return;
    }
    console.log(`[Email] ${path} dispatched`);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[Email] ${path} network error: ${error}`);
  }
}
