/**
 * Chrome storage wrapper with type safety and caching
 */

import type { ReelData, UserPreferences } from '../../shared/types';
import { STORAGE_KEYS, DEFAULT_PREFERENCES, CACHE_EXPIRATION_MS } from '../../shared/constants';

/**
 * Get user preferences from chrome.storage.sync
 */
export async function getPreferences(): Promise<UserPreferences> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEYS.PREFERENCES);
    return result[STORAGE_KEYS.PREFERENCES] || DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Failed to get preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Set user preferences in chrome.storage.sync
 */
export async function setPreferences(preferences: UserPreferences): Promise<void> {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.PREFERENCES]: preferences,
    });
  } catch (error) {
    console.error('Failed to set preferences:', error);
    throw new Error('Failed to save preferences');
  }
}

/**
 * Get cached reels data from chrome.storage.local
 * Returns null if cache is expired or doesn't exist
 */
export async function getCachedReels(profileUrl: string): Promise<ReelData[] | null> {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.CACHE,
      STORAGE_KEYS.CACHE_TIMESTAMP,
    ]);

    const cache = result[STORAGE_KEYS.CACHE];
    const timestamp = result[STORAGE_KEYS.CACHE_TIMESTAMP];

    if (!cache || !timestamp) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - timestamp > CACHE_EXPIRATION_MS) {
      await clearCache();
      return null;
    }

    // Check if cache is for this profile
    const cachedData = cache[profileUrl];
    if (!cachedData) {
      return null;
    }

    return cachedData;
  } catch (error) {
    console.error('Failed to get cached reels:', error);
    return null;
  }
}

/**
 * Cache reels data in chrome.storage.local
 */
export async function cacheReels(profileUrl: string, reels: ReelData[]): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHE);
    const cache = result[STORAGE_KEYS.CACHE] || {};

    cache[profileUrl] = reels;

    await chrome.storage.local.set({
      [STORAGE_KEYS.CACHE]: cache,
      [STORAGE_KEYS.CACHE_TIMESTAMP]: Date.now(),
    });
  } catch (error) {
    console.error('Failed to cache reels:', error);
    // Don't throw - caching is optional
  }
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  try {
    await chrome.storage.local.remove([
      STORAGE_KEYS.CACHE,
      STORAGE_KEYS.CACHE_TIMESTAMP,
    ]);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Clear cache for a specific profile
 */
export async function clearProfileCache(profileUrl: string): Promise<void> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CACHE);
    const cache = result[STORAGE_KEYS.CACHE];

    if (cache && cache[profileUrl]) {
      delete cache[profileUrl];
      await chrome.storage.local.set({ [STORAGE_KEYS.CACHE]: cache });
    }
  } catch (error) {
    console.error('Failed to clear profile cache:', error);
  }
}

/**
 * Get storage usage information
 */
export async function getStorageInfo(): Promise<{ used: number; total: number }> {
  try {
    const bytes = await chrome.storage.local.getBytesInUse();
    // Chrome allows 10MB for local storage
    const total = 10 * 1024 * 1024;
    return { used: bytes, total };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { used: 0, total: 0 };
  }
}
