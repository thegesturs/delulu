/**
 * Constants for the Instagram Reel Sorter extension
 */

import type { UserPreferences } from './types';

/**
 * Chrome storage keys
 */
export const STORAGE_KEYS = {
  PREFERENCES: 'sorted_preferences',
  CACHE: 'sorted_cache',
  CACHE_TIMESTAMP: 'sorted_cache_timestamp',
} as const;

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  sortMetric: 'views',
  quantity: 25,
  autoSort: false,
};

/**
 * Cache expiration time (1 hour in milliseconds)
 */
export const CACHE_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Instagram URL patterns
 */
export const INSTAGRAM_PATTERNS = {
  REELS_TAB: /^https?:\/\/(www\.)?instagram\.com\/[^/]+\/reels\/?(?:\?.*)?$/,
  PROFILE: /^https?:\/\/(www\.)?instagram\.com\/[^/]+\/?$/,
  REEL: /^https?:\/\/(www\.)?instagram\.com\/reel\/[^/]+\/?$/,
} as const;

/**
 * Instagram DOM selectors
 * Note: These are subject to change as Instagram updates its UI
 * Multiple fallback selectors are provided for robustness
 */
export const INSTAGRAM_SELECTORS = {
  // Reel grid containers
  REEL_GRID: [
    'article[role="presentation"]', // Primary container
    'div[style*="display: grid"]', // Fallback for grid layout
  ],

  // Individual reel links
  REEL_LINK: [
    'a[href*="/reel/"]',
    'a[role="link"][href*="/p/"]', // Sometimes uses /p/ instead of /reel/
  ],

  // Reel thumbnail images
  REEL_THUMBNAIL: ['img[alt]', 'img[src]'],

  // View count (usually visible on grid)
  VIEW_COUNT: [
    'span[aria-label*="view"]',
    'span[title*="view"]',
    'span:has(svg[aria-label*="view"])',
  ],

  // Like count (may not be visible on grid)
  LIKE_COUNT: [
    'span[aria-label*="like"]',
    'span[title*="like"]',
    'span:has(svg[aria-label*="like"])',
  ],

  // Comment count (may not be visible on grid)
  COMMENT_COUNT: [
    'span[aria-label*="comment"]',
    'span[title*="comment"]',
    'span:has(svg[aria-label*="comment"])',
  ],

  // Loading indicator
  LOADING_SPINNER: ['svg[aria-label="Loading..."]', 'div[role="progressbar"]'],
} as const;

/**
 * Scraping configuration
 */
export const SCRAPING_CONFIG = {
  // Delay between scroll attempts (ms)
  SCROLL_DELAY: 500,

  // Maximum scroll attempts to prevent infinite loops
  MAX_SCROLL_ATTEMPTS: 100,

  // Wait time for content to load after scroll (ms)
  LOAD_WAIT_TIME: 1000,

  // Maximum reels to scrape for "all" option
  MAX_ALL_REELS: 500,

  // Batch size for processing reels
  BATCH_SIZE: 10,
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  // FAB (Floating Action Button) position
  FAB_POSITION: {
    bottom: '24px',
    right: '24px',
  },

  // Overlay dimensions
  OVERLAY_WIDTH: '90vw',
  OVERLAY_MAX_WIDTH: '1200px',
  OVERLAY_HEIGHT: '85vh',

  // Animation durations (ms)
  FADE_DURATION: 300,
  SCALE_DURATION: 300,

  // Z-index values
  Z_INDEX: {
    BACKDROP: 9998,
    OVERLAY: 9999,
    FAB: 9997,
  },
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NOT_REELS_TAB:
    "Please navigate to a profile's reels tab to use this extension.",
  NO_REELS_FOUND: 'No reels found on this profile.',
  SCRAPING_FAILED: 'Failed to scrape reels. Please try again.',
  TIMEOUT: 'Scraping timed out. The profile may have too many reels.',
  RATE_LIMITED:
    'Instagram is rate limiting requests. Please wait and try again.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  INVALID_SELECTORS:
    "Instagram's page structure has changed. Extension may need an update.",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PREFERENCES_SAVED: 'Preferences saved successfully!',
  SCRAPING_COMPLETE: 'Reels sorted successfully!',
} as const;
