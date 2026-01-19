/**
 * Utilities for handling Instagram's infinite scroll to load more reels
 */

import type { ReelData, Quantity } from '../../shared/types';
import { SCRAPING_CONFIG } from '../../shared/constants';
import { scrapeVisibleReels, waitForLoad } from './instagram-scraper';

/**
 * Progress callback for scroll operations
 */
export type ScrollProgressCallback = (current: number, total: number, message: string) => void;

/**
 * Cancel token for aborting scroll operations
 */
export interface CancelToken {
  cancelled: boolean;
}

/**
 * Create a cancel token
 */
export function createCancelToken(): CancelToken {
  return { cancelled: false };
}

/**
 * Scroll to the bottom of the page
 */
function scrollToBottom(): void {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth',
  });
}

/**
 * Check if we've reached the end of the content
 * Instagram typically shows "You've reached the end" or similar
 */
function hasReachedEnd(): boolean {
  // Look for end-of-content indicators
  const endIndicators = [
    'You\'ve seen all',
    'No more posts',
    'You\'re all caught up',
    'End of posts',
  ];

  const bodyText = document.body.textContent || '';

  return endIndicators.some(indicator =>
    bodyText.toLowerCase().includes(indicator.toLowerCase())
  );
}

/**
 * Wait for new content to load after scrolling
 * Returns true if new content loaded, false if timeout
 */
async function waitForNewContent(
  previousCount: number,
  timeout: number = SCRAPING_CONFIG.LOAD_WAIT_TIME,
): Promise<boolean> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      // Check if we have more elements than before
      const currentReels = scrapeVisibleReels();

      if (currentReels.length > previousCount) {
        resolve(true);
        return;
      }

      // Check if we've reached the end
      if (hasReachedEnd()) {
        resolve(false);
        return;
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      // Check again
      setTimeout(check, 200);
    };

    check();
  });
}

/**
 * Calculate target count based on quantity option
 */
function getTargetCount(quantity: Quantity): number {
  if (quantity === 'all') {
    return SCRAPING_CONFIG.MAX_ALL_REELS;
  }
  return quantity;
}

/**
 * Scroll and load reels until target quantity is reached
 *
 * @param quantity - Number of reels to load (25, 50, or 'all')
 * @param onProgress - Callback for progress updates
 * @param cancelToken - Token to cancel the operation
 * @returns Array of scraped reels
 */
export async function scrollAndLoadReels(
  quantity: Quantity,
  onProgress?: ScrollProgressCallback,
  cancelToken?: CancelToken,
): Promise<ReelData[]> {
  const targetCount = getTargetCount(quantity);
  const allReels = new Map<string, ReelData>(); // Use Map to deduplicate by ID
  let scrollAttempts = 0;
  let consecutiveFailures = 0;

  // Initial scrape
  const initialReels = scrapeVisibleReels();
  for (const reel of initialReels) {
    allReels.set(reel.id, reel);
  }

  onProgress?.(allReels.size, targetCount, `Found ${allReels.size} reels...`);

  // Check if we need to scroll
  if (allReels.size >= targetCount) {
    onProgress?.(allReels.size, targetCount, 'Done!');
    return Array.from(allReels.values());
  }

  // Scroll and load more
  while (
    allReels.size < targetCount &&
    scrollAttempts < SCRAPING_CONFIG.MAX_SCROLL_ATTEMPTS &&
    consecutiveFailures < 3
  ) {
    // Check for cancellation
    if (cancelToken?.cancelled) {
      onProgress?.(allReels.size, targetCount, 'Cancelled');
      break;
    }

    scrollAttempts++;
    const previousCount = allReels.size;

    // Scroll to bottom
    scrollToBottom();
    onProgress?.(
      allReels.size,
      targetCount,
      `Scrolling... (${allReels.size}/${quantity === 'all' ? 'all' : targetCount})`,
    );

    // Wait for scroll delay
    await new Promise(resolve => setTimeout(resolve, SCRAPING_CONFIG.SCROLL_DELAY));

    // Wait for Instagram to load content
    try {
      await waitForLoad(3000);
    } catch (error) {
      console.warn('Wait for load timeout, continuing anyway');
    }

    // Wait for new content to appear
    const hasNewContent = await waitForNewContent(previousCount);

    // Scrape new reels
    const currentReels = scrapeVisibleReels();
    for (const reel of currentReels) {
      allReels.set(reel.id, reel);
    }

    // Update progress
    onProgress?.(
      allReels.size,
      targetCount,
      `Found ${allReels.size} reels...`,
    );

    // Check if we got new content
    if (!hasNewContent || allReels.size === previousCount) {
      consecutiveFailures++;

      // If we've reached the end or had too many failures, stop
      if (hasReachedEnd() || consecutiveFailures >= 3) {
        break;
      }
    } else {
      // Reset failure counter on success
      consecutiveFailures = 0;
    }

    // If we're loading "all" and haven't found new content, we're done
    if (quantity === 'all' && allReels.size === previousCount) {
      break;
    }
  }

  // Final message
  if (scrollAttempts >= SCRAPING_CONFIG.MAX_SCROLL_ATTEMPTS) {
    onProgress?.(
      allReels.size,
      targetCount,
      `Reached maximum scroll attempts (${allReels.size} reels found)`,
    );
  } else if (cancelToken?.cancelled) {
    onProgress?.(allReels.size, targetCount, 'Cancelled');
  } else {
    onProgress?.(allReels.size, targetCount, `Done! Found ${allReels.size} reels`);
  }

  return Array.from(allReels.values());
}

/**
 * Scroll back to top of page
 */
export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

/**
 * Get current scroll position
 */
export function getScrollPosition(): number {
  return window.scrollY || document.documentElement.scrollTop;
}

/**
 * Restore scroll position
 */
export function setScrollPosition(position: number): void {
  window.scrollTo({
    top: position,
    behavior: 'auto',
  });
}
