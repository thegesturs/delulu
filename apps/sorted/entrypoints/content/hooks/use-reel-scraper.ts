/**
 * React hook for orchestrating reel scraping and sorting
 */

import { useState, useCallback, useRef } from 'react';
import type { ReelData, SortMetric, Quantity, ScrapingProgress } from '../../shared/types';
import { scrollAndLoadReels, createCancelToken, type CancelToken } from '../utils/infinite-scroll';
import { validateScrapingCapability } from '../utils/instagram-scraper';
import { getCachedReels, cacheReels } from '../utils/storage-manager';
import { getProfileUrl } from '../utils/url-detector';

/**
 * Sort reels by specified metric
 */
function sortReels(reels: ReelData[], metric: SortMetric): ReelData[] {
  return [...reels].sort((a, b) => {
    const aValue = a.metrics[metric] ?? -1;
    const bValue = b.metrics[metric] ?? -1;

    // Sort descending (highest first)
    return bValue - aValue;
  });
}

/**
 * Hook for scraping and sorting Instagram reels
 */
export function useReelScraper() {
  const [reels, setReels] = useState<ReelData[]>([]);
  const [sortedReels, setSortedReels] = useState<ReelData[]>([]);
  const [progress, setProgress] = useState<ScrapingProgress>({
    status: 'idle',
    current: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const cancelTokenRef = useRef<CancelToken | null>(null);
  const sortMetricRef = useRef<SortMetric>('views');

  /**
   * Start scraping reels
   */
  const startScraping = useCallback(async (
    sortMetric: SortMetric,
    quantity: Quantity,
  ) => {
    try {
      // Reset state
      setError(null);
      setReels([]);
      setSortedReels([]);
      setProgress({
        status: 'scraping',
        current: 0,
        total: quantity === 'all' ? 0 : quantity,
        message: 'Starting...',
      });

      sortMetricRef.current = sortMetric;

      // Validate that we can scrape
      const validationError = validateScrapingCapability();
      if (validationError) {
        throw new Error(validationError);
      }

      // Check cache first
      const profileUrl = getProfileUrl();
      if (profileUrl) {
        const cached = await getCachedReels(profileUrl);
        if (cached && cached.length > 0) {
          console.log(`Using cached reels (${cached.length})`);
          setReels(cached);
          const sorted = sortReels(cached, sortMetric);
          setSortedReels(sorted);
          setProgress({
            status: 'complete',
            current: cached.length,
            total: cached.length,
            message: 'Loaded from cache',
          });
          return;
        }
      }

      // Create cancel token
      cancelTokenRef.current = createCancelToken();

      // Progress callback
      const onProgress = (current: number, total: number, message: string) => {
        setProgress({
          status: 'scraping',
          current,
          total,
          message,
        });
      };

      // Scrape reels
      const scrapedReels = await scrollAndLoadReels(
        quantity,
        onProgress,
        cancelTokenRef.current,
      );

      // Check if cancelled
      if (cancelTokenRef.current.cancelled) {
        setProgress({
          status: 'idle',
          current: 0,
          total: 0,
          message: 'Cancelled',
        });
        return;
      }

      if (scrapedReels.length === 0) {
        throw new Error('No reels found');
      }

      setReels(scrapedReels);

      // Sort reels
      setProgress({
        status: 'sorting',
        current: scrapedReels.length,
        total: scrapedReels.length,
        message: 'Sorting reels...',
      });

      const sorted = sortReels(scrapedReels, sortMetric);
      setSortedReels(sorted);

      // Cache results
      if (profileUrl) {
        await cacheReels(profileUrl, scrapedReels);
      }

      // Complete
      setProgress({
        status: 'complete',
        current: sorted.length,
        total: sorted.length,
        message: `Sorted ${sorted.length} reels by ${sortMetric}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      setProgress({
        status: 'error',
        current: 0,
        total: 0,
        message,
      });
    } finally {
      cancelTokenRef.current = null;
    }
  }, []);

  /**
   * Cancel ongoing scraping
   */
  const cancelScraping = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancelled = true;
      setProgress({
        status: 'idle',
        current: 0,
        total: 0,
        message: 'Cancelled',
      });
    }
  }, []);

  /**
   * Re-sort existing reels by a different metric
   */
  const resortReels = useCallback((newSortMetric: SortMetric) => {
    if (reels.length === 0) {
      return;
    }

    sortMetricRef.current = newSortMetric;
    const sorted = sortReels(reels, newSortMetric);
    setSortedReels(sorted);

    setProgress({
      status: 'complete',
      current: sorted.length,
      total: sorted.length,
      message: `Re-sorted ${sorted.length} reels by ${newSortMetric}`,
    });
  }, [reels]);

  /**
   * Clear all data and reset
   */
  const reset = useCallback(() => {
    cancelScraping();
    setReels([]);
    setSortedReels([]);
    setError(null);
    setProgress({
      status: 'idle',
      current: 0,
      total: 0,
    });
  }, [cancelScraping]);

  return {
    reels,
    sortedReels,
    progress,
    error,
    startScraping,
    cancelScraping,
    resortReels,
    reset,
    isScaping: progress.status === 'scraping' || progress.status === 'sorting',
    isComplete: progress.status === 'complete',
    isError: progress.status === 'error',
  };
}
