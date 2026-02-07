/**
 * Instagram DOM scraping utilities
 *
 * ⚠️ CRITICAL: Instagram's DOM structure changes frequently.
 * These selectors may need to be updated as Instagram evolves.
 *
 * The scraper attempts multiple fallback strategies for robustness.
 */

import { ERROR_MESSAGES, INSTAGRAM_SELECTORS } from "../../shared/constants";
import type { ReelData } from "../../shared/types";
import { getCachedMetrics } from "./graphql-interceptor";

/**
 * Try multiple selectors until one returns an element
 */
function trySelectors(
  container: Element,
  selectors: readonly string[]
): Element | null {
  for (const selector of selectors) {
    try {
      const element = container.querySelector(selector);
      if (element) {
        return element;
      }
    } catch (error) {
      // Invalid selector, continue to next
      console.warn(`Invalid selector: ${selector}`, error);
    }
  }
  return null;
}

/**
 * Try multiple selectors until one returns elements
 */
function trySelectorsAll(
  container: Element | Document,
  selectors: readonly string[]
): Element[] {
  for (const selector of selectors) {
    try {
      const elements = Array.from(container.querySelectorAll(selector));
      if (elements.length > 0) {
        return elements;
      }
    } catch (error) {
      // Invalid selector, continue to next
      console.warn(`Invalid selector: ${selector}`, error);
    }
  }
  return [];
}

// DOM metric extraction removed - we now use GraphQL interceptor exclusively

// Top-level regex patterns for performance
const REEL_ID_REGEX = /\/reel\/([^/?]+)/;
const URL_MATCH_REGEX = /url\(['"]?([^'"]+)['"]?\)/;

/**
 * Extract reel ID from URL
 */
function extractReelId(url: string): string | null {
  const match = url.match(REEL_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Scrape metrics from a single reel element
 */
export function scrapeReelElement(reelElement: Element): ReelData | null {
  try {
    // Find the link element
    const linkElement = trySelectors(
      reelElement,
      INSTAGRAM_SELECTORS.REEL_LINK
    );
    if (!linkElement) {
      console.warn("No link found in reel element", reelElement);
      return null;
    }

    const href = linkElement.getAttribute("href");
    if (!href) {
      console.warn("Link has no href", linkElement);
      return null;
    }

    // Construct full URL
    const url = href.startsWith("http")
      ? href
      : `https://www.instagram.com${href}`;

    // Extract reel ID
    const id = extractReelId(url);
    if (!id) {
      console.warn("Could not extract reel ID from URL", url);
      return null;
    }

    // Find thumbnail - Instagram uses CSS background-image, not <img> tags!
    let thumbnailUrl = "";

    // Strategy 1: Look for background-image in the reel container (primary method)
    const bgElement = reelElement.querySelector(
      '[style*="background-image"]'
    ) as HTMLElement;
    if (bgElement) {
      const bgImage = bgElement.style.backgroundImage;
      if (bgImage && bgImage !== "none") {
        const urlMatch = bgImage.match(URL_MATCH_REGEX);
        if (urlMatch) {
          thumbnailUrl = urlMatch[1];
          // Filter out GIF placeholders (Instagram uses these for loading states)
          if (thumbnailUrl.startsWith("data:image/gif")) {
            thumbnailUrl = "";
          }
        }
      }
    }

    // Strategy 2: Check link element for background-image
    if (!thumbnailUrl) {
      const linkBg = (linkElement as HTMLElement).style?.backgroundImage;
      if (linkBg && linkBg !== "none") {
        const urlMatch = linkBg.match(URL_MATCH_REGEX);
        if (urlMatch && !urlMatch[1].startsWith("data:image/gif")) {
          thumbnailUrl = urlMatch[1];
        }
      }
    }

    // Strategy 3: Look for img elements (fallback for posts)
    if (!thumbnailUrl) {
      const imgElement = reelElement.querySelector(
        "img[src]"
      ) as HTMLImageElement;
      if (imgElement) {
        const src = imgElement.getAttribute("src") || "";
        if (src && !src.startsWith("data:image/gif")) {
          thumbnailUrl = src;
        }
      }
    }

    // Strategy 4: Check computed styles (more expensive, last resort)
    if (!thumbnailUrl && bgElement) {
      const computedBg = window.getComputedStyle(bgElement).backgroundImage;
      if (computedBg && computedBg !== "none") {
        const urlMatch = computedBg.match(URL_MATCH_REGEX);
        if (urlMatch && !urlMatch[1].startsWith("data:image/gif")) {
          thumbnailUrl = urlMatch[1];
        }
      }
    }

    // Get metrics from GraphQL interceptor cache ONLY
    // Instagram sends these via GraphQL - we intercept and cache them
    const metrics = getCachedMetrics(id) || {
      views: undefined,
      likes: undefined,
      comments: undefined,
    };

    return {
      id,
      url,
      thumbnailUrl,
      metrics,
      scrapedAt: Date.now(),
    };
  } catch (error) {
    console.error("Error scraping reel element:", error, reelElement);
    return null;
  }
}

/**
 * Find all reel elements currently visible on the page
 */
export function findReelElements(): Element[] {
  // Try to find reel grid container first
  const gridContainers = trySelectorsAll(
    document,
    INSTAGRAM_SELECTORS.REEL_GRID
  );

  if (gridContainers.length > 0) {
    // Find all reel links within the grid
    const reelLinks: Element[] = [];
    for (const container of gridContainers) {
      const links = trySelectorsAll(container, INSTAGRAM_SELECTORS.REEL_LINK);
      reelLinks.push(...links);
    }

    // Get parent elements of links (usually the article/div containers)
    const reelElements = reelLinks
      .map(
        (link) => link.closest("article") || link.closest("div[class]") || link
      )
      .filter((el, index, arr) => arr.indexOf(el) === index); // Remove duplicates

    return reelElements;
  }

  // Fallback: Find all reel links directly
  const reelLinks = trySelectorsAll(document, INSTAGRAM_SELECTORS.REEL_LINK);

  // Get parent containers
  const reelElements = reelLinks
    .map(
      (link) => link.closest("article") || link.closest("div[class]") || link
    )
    .filter((el, index, arr) => arr.indexOf(el) === index); // Remove duplicates

  return reelElements;
}

/**
 * Scrape all visible reels on the current page
 */
export function scrapeVisibleReels(): ReelData[] {
  const reelElements = findReelElements();
  const reels: ReelData[] = [];
  const seenIds = new Set<string>();

  for (const element of reelElements) {
    const reel = scrapeReelElement(element);
    if (reel && !seenIds.has(reel.id)) {
      reels.push(reel);
      seenIds.add(reel.id);
    }
  }

  return reels;
}

/**
 * Check if Instagram is currently loading content
 */
export function isLoading(): boolean {
  const loadingElements = trySelectorsAll(
    document,
    INSTAGRAM_SELECTORS.LOADING_SPINNER
  );
  return loadingElements.length > 0;
}

/**
 * Wait for Instagram to finish loading
 */
export async function waitForLoad(timeout = 5000): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (!isLoading()) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error("Loading timeout"));
        return;
      }

      setTimeout(check, 100);
    };

    check();
  });
}

/**
 * Validate that we're able to scrape reels
 * Returns null if valid, error message if invalid
 */
export function validateScrapingCapability(): string | null {
  // Check if we can find any reel elements
  const reelElements = findReelElements();

  if (reelElements.length === 0) {
    return ERROR_MESSAGES.NO_REELS_FOUND;
  }

  // Try to scrape one reel to verify selectors work
  const testReel = scrapeReelElement(reelElements[0]);

  if (!testReel) {
    return ERROR_MESSAGES.INVALID_SELECTORS;
  }

  // Check if we got at least one metric
  const hasAnyMetric =
    testReel.metrics.views !== undefined ||
    testReel.metrics.likes !== undefined ||
    testReel.metrics.comments !== undefined;

  if (!hasAnyMetric) {
    console.warn(
      "Warning: Could not extract any metrics from test reel. Metrics may not be available in grid view."
    );
    // Don't return error - we can still sort by available metrics
  }

  return null;
}
