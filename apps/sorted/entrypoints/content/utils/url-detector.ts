/**
 * Utilities for detecting Instagram reels tab URLs and handling SPA navigation
 */

import { INSTAGRAM_PATTERNS } from "../../shared/constants";

/**
 * Check if current URL is an Instagram reels tab
 */
export function isReelsTab(url: string = window.location.href): boolean {
  return INSTAGRAM_PATTERNS.REELS_TAB.test(url);
}

/**
 * Check if current URL is an Instagram profile
 */
export function isProfile(url: string = window.location.href): boolean {
  return INSTAGRAM_PATTERNS.PROFILE.test(url);
}

/**
 * Check if current URL is a single reel page
 */
export function isReelPage(url: string = window.location.href): boolean {
  return INSTAGRAM_PATTERNS.REEL.test(url);
}

// Top-level regex for performance
const USERNAME_REGEX = /instagram\.com\/([^/?]+)/;

/**
 * Extract username from Instagram profile URL
 * Returns null if not a valid profile URL
 */
export function extractUsername(
  url: string = window.location.href
): string | null {
  const match = url.match(USERNAME_REGEX);
  if (!match || match[1] === "reel" || match[1] === "p") {
    return null;
  }
  return match[1];
}

/**
 * Get the current profile URL (base profile without /reels)
 */
export function getProfileUrl(
  url: string = window.location.href
): string | null {
  const username = extractUsername(url);
  if (!username) {
    return null;
  }
  return `https://www.instagram.com/${username}/`;
}

/**
 * Callback type for URL change listeners
 */
export type UrlChangeCallback = (newUrl: string, oldUrl: string) => void;

/**
 * Monitor URL changes in Instagram's SPA
 * Uses polling as primary detection (works across isolated/MAIN worlds)
 * with pushState/popstate as supplementary signals.
 * Returns a cleanup function to stop monitoring
 */
export function monitorUrlChanges(callback: UrlChangeCallback): () => void {
  let currentUrl = window.location.href;

  const notifyIfChanged = () => {
    const newUrl = window.location.href;
    if (newUrl !== currentUrl) {
      const oldUrl = currentUrl;
      currentUrl = newUrl;
      callback(newUrl, oldUrl);
    }
  };

  // Poll for URL changes — catches SPA navigations that happen in the
  // MAIN world (pushState/replaceState overrides don't work cross-world)
  const pollInterval = setInterval(notifyIfChanged, 300);

  // Handle back/forward navigation (fires synchronously)
  const popstateHandler = () => notifyIfChanged();
  window.addEventListener("popstate", popstateHandler);

  // Cleanup function
  return () => {
    clearInterval(pollInterval);
    window.removeEventListener("popstate", popstateHandler);
  };
}

/**
 * Wait for Instagram to finish loading/navigating
 * Resolves when the page content is stable
 */
export async function waitForPageLoad(timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkLoading = () => {
      // Check if there's a loading spinner
      const loadingSpinner = document.querySelector(
        'svg[aria-label="Loading..."]'
      );

      if (!loadingSpinner) {
        resolve();
        return;
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        reject(new Error("Page load timeout"));
        return;
      }

      // Check again after a short delay
      setTimeout(checkLoading, 100);
    };

    checkLoading();
  });
}

/**
 * Create a reels tab URL from a profile URL
 */
export function createReelsTabUrl(profileUrl: string): string {
  const username = extractUsername(profileUrl);
  if (!username) {
    throw new Error("Invalid profile URL");
  }
  return `https://www.instagram.com/${username}/reels/`;
}

/**
 * Navigate to reels tab if not already there
 * Returns true if navigation occurred, false if already on reels tab
 */
export function navigateToReelsTab(): boolean {
  if (isReelsTab()) {
    return false;
  }

  const username = extractUsername();
  if (!username) {
    throw new Error("Not on an Instagram profile page");
  }

  const reelsUrl = createReelsTabUrl(window.location.href);
  window.location.href = reelsUrl;
  return true;
}
