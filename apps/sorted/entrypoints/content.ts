/**
 * Content script for Instagram integration
 */

import React from "react";
import { createRoot } from "react-dom/client";
import { LoadingOverlay } from "./content/components/loading-overlay";
import { ReelPageFab } from "./content/components/reel-page-fab";
import { SortPanel } from "./content/components/sort-panel";
import { SortedGrid } from "./content/components/sorted-grid";
// Import styles inline to ensure they are injected
import overlayStyles from "./content/styles/overlay.css?inline";
import { handleExport } from "./content/utils/export";
import { initializeGraphQLInterceptor } from "./content/utils/graphql-interceptor";
import {
  createCancelToken,
  scrollAndLoadReels,
} from "./content/utils/infinite-scroll";
import { validateScrapingCapability } from "./content/utils/instagram-scraper";
import {
  isReelPage,
  isReelsTab,
  monitorUrlChanges,
} from "./content/utils/url-detector";
import type { ExportFormat, ReelData, SortMetric } from "./shared/types";

export default defineContentScript({
  matches: ["*://www.instagram.com/*", "*://instagram.com/*"],
  runAt: "document_start", // Run EARLY to hook XHR before Instagram

  main() {
    // Inject styles immediately
    const styleSheet = document.createElement("style");
    styleSheet.textContent = overlayStyles;
    styleSheet.id = "sorted-styles";
    (document.head || document.documentElement).appendChild(styleSheet);

    // Inject external interceptor script (bypasses CSP)
    const interceptorScript = document.createElement("script");
    interceptorScript.src = browser.runtime.getURL("/interceptor.js");
    interceptorScript.onerror = () =>
      console.error("[Sorted] Failed to load interceptor");
    (document.head || document.documentElement).prepend(interceptorScript);

    // Initialize GraphQL interceptor FIRST (before Instagram makes API calls)
    initializeGraphQLInterceptor();

    let panelContainer: HTMLElement | null = null;
    let gridContainer: HTMLElement | null = null;
    let loadingContainer: HTMLElement | null = null;
    // biome-ignore lint/suspicious/noExplicitAny: React root types are complex
    let panelRoot: any = null;
    // biome-ignore lint/suspicious/noExplicitAny: React root types are complex
    let gridRoot: any = null;
    // biome-ignore lint/suspicious/noExplicitAny: React root types are complex
    let loadingRoot: any = null;
    let _cleanupUrlMonitor: (() => void) | null = null;
    let takeoverTarget: HTMLElement | null = null;
    let reelsObserver: MutationObserver | null = null;
    let isSorting = false;
    let isActive = false;
    let isCancelled = false;
    let currentReels: ReelData[] = [];
    let currentMetric: SortMetric = "views";
    let currentQuantity: number = 25;
    let fabContainer: HTMLElement | null = null;
    // biome-ignore lint/suspicious/noExplicitAny: React root types are complex
    let fabRoot: any = null;

    /**
     * Handle export action
     */
    function onExportReels(format: ExportFormat) {
      handleExport(format, currentReels);
    }

    /**
     * Show loading overlay
     */
    function showLoadingOverlay(
      message: string = "Analyzing reels...",
      progress?: string
    ) {
      if (!loadingContainer) {
        loadingContainer = document.createElement("div");
        loadingContainer.id = "sorted-loading";
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
      if (metric === "oldest") {
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
        "main > div > div > div > div", // Common Instagram structure
        "article",
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
    function createSortPanel() {
      if (panelContainer) {
        return;
      }

      const reelsContainer = findReelsContainer();
      if (!reelsContainer) {
        return;
      }

      // Create panel container
      panelContainer = document.createElement("div");
      panelContainer.id = "sorted-panel";

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
          isSorting,
          onReset: handleReset,
          isActive,
          onExport: onExportReels,
        })
      );
    }

    /**
     * Wait for reels to appear in the DOM, then create the sort panel.
     * Uses MutationObserver instead of fragile setTimeout retries.
     * Keeps observing until createSortPanel() actually succeeds (panel injected).
     */
    function waitForReelsAndCreatePanel() {
      // Try immediately first
      if (findReelsContainer()) {
        createSortPanel();
        if (panelContainer) {
          return;
        }
      }

      // Disconnect any existing observer
      if (reelsObserver) {
        reelsObserver.disconnect();
        reelsObserver = null;
      }

      // Watch for reel links to appear AND the grid container to be ready
      reelsObserver = new MutationObserver(() => {
        if (!document.querySelector('a[href*="/reel/"]')) {
          return;
        }

        // Reel links exist — try to create the panel.
        // Only disconnect if the panel was actually injected.
        createSortPanel();
        if (panelContainer) {
          reelsObserver?.disconnect();
          reelsObserver = null;
        }
      });

      reelsObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Safety timeout: disconnect after 60s to prevent leaks
      setTimeout(() => {
        if (reelsObserver) {
          reelsObserver.disconnect();
          reelsObserver = null;
        }
      }, 60_000);
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
        showLoadingOverlay("Loading reels...", "Scrolling through profile");

        // Scroll aggressively to trigger Instagram to load ALL data with metrics
        for (let i = 0; i < 3; i++) {
          if (isCancelled) {
            return; // Check if operation was cancelled
          }
          showLoadingOverlay("Loading reels...", `Scroll ${i + 1}/3`);
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (isCancelled) {
          return; // Check if operation was cancelled
        }

        // Scroll back to top
        showLoadingOverlay("Processing reels...", "Analyzing metrics");
        window.scrollTo({ top: 0, behavior: "smooth" });
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
          // biome-ignore lint/suspicious/noAlert: browser extension requires alert for user feedback
          alert(error);
          return;
        }

        // Scrape reels
        const cancelToken = createCancelToken();
        const reels = await scrollAndLoadReels(
          // biome-ignore lint/suspicious/noExplicitAny: quantity type conversion needed
          quantity as any,
          // biome-ignore lint/suspicious/noEmptyBlockStatements: progress callback intentionally empty
          () => {}, // Progress callback
          cancelToken
        );

        if (isCancelled) {
          return; // Check if operation was cancelled after scraping
        }

        if (reels.length === 0) {
          // biome-ignore lint/suspicious/noAlert: browser extension requires alert for user feedback
          alert("No reels found");
          return;
        }

        // Sort reels
        showLoadingOverlay("Sorting reels...", `By ${metric}`);
        const sorted = sortReels(reels, metric);
        currentReels = sorted.slice(0, quantity);

        if (isCancelled) {
          return; // Check if operation was cancelled before grid replacement
        }

        // Replace Instagram grid with sorted grid
        const gridReplaced = takeoverContent();
        if (!gridReplaced) {
          // biome-ignore lint/suspicious/noAlert: browser extension requires alert for user feedback
          alert("Failed to replace grid. Reels container not found.");
          return;
        }
        isActive = true;

        // Hide loading overlay after a brief moment to show completion
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error("[Sorted] Sort failed:", error);
        // biome-ignore lint/suspicious/noAlert: browser extension requires alert for user feedback
        alert("Failed to sort reels. Please try again.");
      } finally {
        hideLoadingOverlay();
        isSorting = false;
        updatePanel();
      }
    }

    /**
     * Take over Instagram's content area, replacing it entirely with our sorted grid.
     * This kills Instagram's scroll listeners, IntersectionObservers, and React internals
     * by clearing the DOM subtree that hosts them.
     * @returns true if successful, false otherwise
     */
    function takeoverContent(): boolean {
      const reelsContainer = findReelsContainer();
      if (!reelsContainer) {
        return false;
      }

      // Walk up to the parent that holds tabs + grid — this is our takeover target
      const target = reelsContainer.parentElement;
      if (!target) {
        return false;
      }

      // Capture width before clearing
      const originalWidth = target.offsetWidth;

      // Nuke Instagram's DOM subtree — detaches all event listeners, observers, React fibers
      takeoverTarget = target;
      target.innerHTML = "";

      // Style the takeover container for self-contained scrolling
      target.style.overflowY = "auto";
      target.style.height = "calc(100vh - 80px)";
      target.id = "sorted-takeover";

      // Kill the page-level scrollbar so only our container scrolls
      document.documentElement.style.overflow = "hidden";

      // Create and append panel container
      panelContainer = document.createElement("div");
      panelContainer.id = "sorted-panel";
      target.appendChild(panelContainer);

      // Create and append grid container
      gridContainer = document.createElement("div");
      gridContainer.id = "sorted-grid";
      if (originalWidth > 0) {
        gridContainer.style.width = `${originalWidth}px`;
      }
      target.appendChild(gridContainer);

      // Mount React roots
      panelRoot = createRoot(panelContainer);
      panelRoot.render(
        React.createElement(SortPanel, {
          onSort: handleSort,
          isSorting,
          onReset: handleReset,
          isActive: true,
          onExport: onExportReels,
        })
      );

      gridRoot = createRoot(gridContainer);
      gridRoot.render(
        React.createElement(SortedGrid, {
          reels: currentReels,
          sortMetric: currentMetric,
          quantity: currentQuantity,
        })
      );

      // Signal interceptor to suppress further reel-loading XHR
      window.postMessage({ type: "SORTED_TAKEOVER" }, "*");

      return true;
    }

    /**
     * Reset to original Instagram grid — reload the page since we nuked Instagram's DOM
     */
    function handleReset() {
      // Unmount React roots to avoid memory leaks
      if (gridRoot) {
        gridRoot.unmount();
        gridRoot = null;
      }
      if (panelRoot) {
        panelRoot.unmount();
        panelRoot = null;
      }

      isActive = false;
      currentReels = [];
      takeoverTarget = null;
      gridContainer = null;
      panelContainer = null;

      // Reload page to restore Instagram's original state
      window.location.reload();
    }

    /**
     * Update panel state
     */
    function updatePanel() {
      if (panelRoot && panelContainer) {
        panelRoot.render(
          React.createElement(SortPanel, {
            onSort: handleSort,
            isSorting,
            onReset: handleReset,
            isActive,
            onExport: onExportReels,
          })
        );
      }
    }

    /**
     * Create floating transcribe button for individual reel pages
     */
    function createReelPageFab() {
      if (fabContainer) {
        return;
      }
      fabContainer = document.createElement("div");
      fabContainer.id = "sorted-reel-fab-container";
      document.body.appendChild(fabContainer);
      fabRoot = createRoot(fabContainer);
      fabRoot.render(React.createElement(ReelPageFab));
    }

    /**
     * Remove floating transcribe button
     */
    function removeReelPageFab() {
      if (fabRoot) {
        fabRoot.unmount();
        fabRoot = null;
      }
      if (fabContainer) {
        fabContainer.remove();
        fabContainer = null;
      }
    }

    /**
     * Handle URL changes
     */
    function handleUrlChange(newUrl: string) {
      if (isReelsTab(newUrl)) {
        removeReelPageFab();
        waitForReelsAndCreatePanel();
      } else if (isReelPage(newUrl)) {
        cleanup();
        createReelPageFab();
      } else {
        cleanup();
        removeReelPageFab();
      }
    }

    /**
     * Soft cleanup for SPA navigation — unmount roots and clear state without page reload.
     * Instagram's own navigation handles the page transition.
     */
    function cleanup() {
      isCancelled = true;
      if (reelsObserver) {
        reelsObserver.disconnect();
        reelsObserver = null;
      }
      hideLoadingOverlay();

      // Unmount React roots
      if (panelRoot) {
        panelRoot.unmount();
        panelRoot = null;
      }
      if (gridRoot) {
        gridRoot.unmount();
        gridRoot = null;
      }

      // Clear references (DOM will be cleaned up by Instagram's navigation)
      panelContainer = null;
      gridContainer = null;
      takeoverTarget = null;
      isActive = false;
      isSorting = false;
      currentReels = [];
    }

    /**
     * Initialize
     */
    function initialize() {
      const startObserving = () => {
        if (isReelsTab()) {
          waitForReelsAndCreatePanel();
        } else if (isReelPage()) {
          createReelPageFab();
        }
        _cleanupUrlMonitor = monitorUrlChanges(handleUrlChange);
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startObserving, {
          once: true,
        });
      } else {
        startObserving();
      }
    }

    // Initialize
    initialize();

    // Cleanup on page unload
    window.addEventListener("beforeunload", cleanup);
  },
});
