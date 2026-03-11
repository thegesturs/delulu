/**
 * Auth helper for content scripts.
 * Communicates with the background service worker to get the Clerk JWT token.
 */

export async function getAuthToken(): Promise<string | null> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_AUTH_TOKEN",
    });
    return response?.token ?? null;
  } catch {
    return null;
  }
}
