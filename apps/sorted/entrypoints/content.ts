/**
 * Content script for Instagram integration
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoadingOverlay } from './content/components/loading-overlay';
import { SortPanel } from './content/components/sort-panel';
import { SortedGrid } from './content/components/sorted-grid';
// Import styles inline to ensure they are injected
import overlayStyles from './content/styles/overlay.css?inline';
import { initializeGraphQLInterceptor } from './content/utils/graphql-interceptor';
import {
  createCancelToken,
  scrollAndLoadReels,
} from './content/utils/infinite-scroll';
import { validateScrapingCapability } from './content/utils/instagram-scraper';
import { isReelsTab, monitorUrlChanges } from './content/utils/url-detector';
import type { ReelData, SortMetric } from './shared/types';

export default defineContentScript({
  matches: ['*://www.instagram.com/*', '*://instagram.com/*'],
  runAt: 'document_start', // Run EARLY to hook XHR before Instagram

  main() {
    // Inject styles immediately
    const styleSheet = document.createElement('style');
    styleSheet.textContent = overlayStyles;
    styleSheet.id = 'sorted-styles';
    (document.head || document.documentElement).appendChild(styleSheet);

    // Inject external interceptor script (bypasses CSP)
    const interceptorScript = document.createElement('script');
    interceptorScript.src = browser.runtime.getURL('/interceptor.js');
    interceptorScript.onerror = () =>
      console.error('[Sorted] Failed to load interceptor');
    (document.head || document.documentElement).prepend(interceptorScript);

    // Initialize GraphQL interceptor FIRST (before Instagram makes API calls)
    initializeGraphQLInterceptor();

    let panelContainer: HTMLElement | null = null;
    let gridContainer: HTMLElement | null = null;
    let loadingContainer: HTMLElement | null = null;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let panelRoot: any = null;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let gridRoot: any = null;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    let loadingRoot: any = null;
    let _cleanupUrlMonitor: (() => void) | null = null;
    let originalGrid: HTMLElement | null = null;
    let isSorting = false;
    let isActive = false;
    let isCancelled = false;
    let currentReels: ReelData[] = [];
    let currentMetric: SortMetric = 'views';
    let currentQuantity: number = 25;

    /**
     * Show loading overlay
     */
    function showLoadingOverlay(
      message: string = 'Analyzing reels...',
      progress?: string
    ) {
      if (!loadingContainer) {
        loadingContainer = document.createElement('div');
        loadingContainer.id = 'sorted-loading';
        document.body.appendChild(loadingContainer);
        loadingRoot = createRoot(loadingContainer);
      }

      loadingRoot.render(
        React.createElement(LoadingOverlay, { message, progress })
      );
    }

    /**
     * Hide loading overlay
     */
    function hideLoadingOverlay() {
      if (loadingRoot) {
        loadingRoot.unmount();
        loadingRoot = null;
      }
      if (loadingContainer) {
        loadingContainer.remove();
        loadingContainer = null;
      }
    }

    /**
     * Sort reels by specified metric
     */
    function sortReels(reels: ReelData[], metric: SortMetric): ReelData[] {
      // For "oldest", just reverse the Instagram order (newest first → oldest first)
      if (metric === 'oldest') {
        return [...reels].reverse();
      }

      // For other metrics, sort descending (highest first)
      return [...reels].sort((a, b) => {
        const aValue = a.metrics[metric] ?? -1;
        const bValue = b.metrics[metric] ?? -1;
        return bValue - aValue;
      });
    }

    /**
     * Find Instagram's reels grid container
     */
    function findReelsContainer(): HTMLElement | null {
      // First, try to find any reel link
      const reelLinks = document.querySelectorAll('a[href*="/reel/"]');

      if (reelLinks.length === 0) {
        return null;
      }

      // Find the common parent that contains all reel links
      const firstLink = reelLinks[0];
      let container = firstLink.parentElement;

      // Walk up the DOM tree to find a container with multiple reels
      while (container) {
        const reelsInContainer =
          container.querySelectorAll('a[href*="/reel/"]').length;

        // If this container has most/all of the reels, it's probably the grid
        if (reelsInContainer >= reelLinks.length * 0.8) {
          return container as HTMLElement;
        }

        container = container.parentElement;
      }

      // Fallback: try specific selectors
      const selectors = [
        'main > div > div > div > div', // Common Instagram structure
        'article',
        '[style*="display: grid"]',
        '[style*="display:grid"]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (element.querySelector('a[href*="/reel/"]')) {
            return element as HTMLElement;
          }
        }
      }

      return null;
    }

    /**
     * Create and inject the sort panel
     */
    function createSortPanel(retryCount = 0) {
      if (panelContainer) {
        return;
      }

      const reelsContainer = findReelsContainer();
      if (!reelsContainer) {
        // Retry up to 5 times with increasing delays
        if (retryCount < 5) {
          const delay = 1000 * (retryCount + 1); // 1s, 2s, 3s, 4s, 5s
          setTimeout(() => createSortPanel(retryCount + 1), delay);
        }
        return;
      }

      // Create panel container
      panelContainer = document.createElement('div');
      panelContainer.id = 'sorted-panel';
      // No inline styles here, managed by CSS class

      // Insert before reels container
      reelsContainer.parentElement?.insertBefore(
        panelContainer,
        reelsContainer
      );

      // Create React root
      panelRoot = createRoot(panelContainer);
      panelRoot.render(
        React.createElement(SortPanel, {
          onSort: handleSort,
          isSorting: isSorting,
          onReset: handleReset,
          isActive: isActive,
        })
      );
    }

    /**
     * Remove sort panel
     */
    function removeSortPanel() {
      if (panelRoot) {
        panelRoot.unmount();
        panelRoot = null;
      }
      if (panelContainer) {
        panelContainer.remove();
        panelContainer = null;
      }
    }

    /**
     * Handle sort action
     */
    async function handleSort(metric: SortMetric, quantity: number) {
      if (isSorting) {
        return;
      }

      try {
        isSorting = true;
        isCancelled = false; // Reset cancellation flag for new operation
        currentMetric = metric;
        currentQuantity = quantity;
        updatePanel();

        // Show loading overlay
        showLoadingOverlay('Loading reels...', 'Scrolling through profile');

        // Scroll aggressively to trigger Instagram to load ALL data with metrics
        for (let i = 0; i < 3; i++) {
          if (isCancelled) {
            return; // Check if operation was cancelled
          }
          showLoadingOverlay('Loading reels...', `Scroll ${i + 1}/3`);
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth',
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (isCancelled) {
          return; // Check if operation was cancelled
        }

        // Scroll back to top
        showLoadingOverlay('Processing reels...', 'Analyzing metrics');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (isCancelled) {
          return; // Check if operation was cancelled
        }

        // Wait for postMessage events to be processed
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (isCancelled) {
          return; // Check if operation was cancelled
        }

        // Validate scraping capability
        const error = validateScrapingCapability();
        if (error) {
          alert(error);
          return;
        }

        // Scrape reels
        const cancelToken = createCancelToken();
        const reels = await scrollAndLoadReels(
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          quantity as any,
          () => {}, // Progress callback
          cancelToken
        );

        if (isCancelled) {
          return; // Check if operation was cancelled after scraping
        }

        if (reels.length === 0) {
          alert('No reels found');
          return;
        }

        // Sort reels
        showLoadingOverlay('Sorting reels...', `By ${metric}`);
        const sorted = sortReels(reels, metric);
        currentReels = sorted.slice(0, quantity);

        if (isCancelled) {
          return; // Check if operation was cancelled before grid replacement
        }

        // Replace Instagram grid with sorted grid
        const gridReplaced = replaceGrid();
        if (!gridReplaced) {
          alert('Failed to replace grid. Reels container not found.');
          return;
        }
        isActive = true;

        // Hide loading overlay after a brief moment to show completion
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error('[Sorted] Sort failed:', error);
        alert('Failed to sort reels. Please try again.');
      } finally {
        hideLoadingOverlay();
        isSorting = false;
        updatePanel();
      }
    }

    /**
     * Replace Instagram's grid with our sorted grid
     * @returns true if successful, false otherwise
     */
    function replaceGrid(): boolean {
      const reelsContainer = findReelsContainer();
      if (!reelsContainer) {
        return false;
      }

      // Hide original grid
      if (!originalGrid) {
        originalGrid = reelsContainer;
      }
      originalGrid.style.display = 'none';

      // Create our grid container if it doesn't exist
      if (!gridContainer) {
        gridContainer = document.createElement('div');
        gridContainer.id = 'sorted-grid';
        originalGrid.parentElement?.insertBefore(
          gridContainer,
          originalGrid.nextSibling
        );
      }

      // Render sorted grid
      if (!gridRoot) {
        gridRoot = createRoot(gridContainer);
      }

      gridRoot.render(
        React.createElement(SortedGrid, {
          reels: currentReels,
          sortMetric: currentMetric,
          quantity: currentQuantity,
        })
      );

      return true;
    }

    /**
     * Reset to original Instagram grid
     */
    function handleReset() {
      if (originalGrid) {
        originalGrid.style.display = '';
      }

      if (gridRoot) {
        gridRoot.unmount();
        gridRoot = null;
      }

      if (gridContainer) {
        gridContainer.remove();
        gridContainer = null;
      }

      isActive = false;
      currentReels = [];
      updatePanel();
    }

    /**
     * Update panel state
     */
    function updatePanel() {
      if (panelRoot && panelContainer) {
        panelRoot.render(
          React.createElement(SortPanel, {
            onSort: handleSort,
            isSorting: isSorting,
            onReset: handleReset,
            isActive: isActive,
          })
        );
      }
    }

    /**
     * Handle URL changes
     */
    function handleUrlChange(newUrl: string) {
      if (isReelsTab(newUrl)) {
        setTimeout(() => createSortPanel(), 1000);
      } else {
        cleanup();
      }
    }

    /**
     * Cleanup
     */
    function cleanup() {
      isCancelled = true;
      hideLoadingOverlay();
      removeSortPanel();
      handleReset();
    }

    /**
     * Initialize
     */
    function initialize() {
      if (isReelsTab()) {
        setTimeout(() => createSortPanel(), 2000);
      }

      _cleanupUrlMonitor = monitorUrlChanges(handleUrlChange);
    }

    // Initialize
    initialize();

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
  },
});
