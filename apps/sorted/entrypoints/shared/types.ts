/**
 * Core type definitions for the Instagram Reel Sorter extension
 */

/**
 * Represents metrics for a single reel
 */
export interface ReelMetrics {
  likes?: number | null;
  views?: number | null;
  comments?: number | null;
  videoUrl?: string;
}

/**
 * Represents a single Instagram reel with its metadata
 */
export interface ReelData {
  id: string;
  url: string;
  thumbnailUrl: string;
  metrics: ReelMetrics;
  videoUrl?: string;
  scrapedAt: number; // Timestamp when scraped
}

/**
 * Metric to sort by
 */
export type SortMetric = "likes" | "views" | "comments" | "oldest";

/**
 * Export format for reel data
 */
export type ExportFormat = "json" | "csv" | "xlsx";

/**
 * Number of reels to scrape
 */
export type Quantity = 25 | 50 | "all";

/**
 * User preferences stored in chrome.storage
 */
export interface UserPreferences {
  sortMetric: SortMetric;
  quantity: Quantity;
  autoSort: boolean;
}

/**
 * Scraping state
 */
export type ScrapingStatus =
  | "idle"
  | "scraping"
  | "sorting"
  | "complete"
  | "error";

/**
 * Scraping progress information
 */
export interface ScrapingProgress {
  status: ScrapingStatus;
  current: number;
  total: number;
  message?: string;
}

/**
 * Message types for communication between extension contexts
 */
// biome-ignore lint/style/noEnum: enum needed for extension message types
export enum MessageType {
  OPEN_OVERLAY = "OPEN_OVERLAY",
  CLOSE_OVERLAY = "CLOSE_OVERLAY",
  START_SCRAPING = "START_SCRAPING",
  CANCEL_SCRAPING = "CANCEL_SCRAPING",
  SCRAPING_PROGRESS = "SCRAPING_PROGRESS",
  SCRAPING_COMPLETE = "SCRAPING_COMPLETE",
  SCRAPING_ERROR = "SCRAPING_ERROR",
  GET_PREFERENCES = "GET_PREFERENCES",
  SET_PREFERENCES = "SET_PREFERENCES",
}

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType;
}

/**
 * Message to start scraping
 */
export interface StartScrapingMessage extends BaseMessage {
  type: MessageType.START_SCRAPING;
  sortMetric: SortMetric;
  quantity: Quantity;
}

/**
 * Message with scraping progress
 */
export interface ScrapingProgressMessage extends BaseMessage {
  type: MessageType.SCRAPING_PROGRESS;
  progress: ScrapingProgress;
}

/**
 * Message with scraping results
 */
export interface ScrapingCompleteMessage extends BaseMessage {
  type: MessageType.SCRAPING_COMPLETE;
  reels: ReelData[];
  sortMetric: SortMetric;
}

/**
 * Message with error information
 */
export interface ScrapingErrorMessage extends BaseMessage {
  type: MessageType.SCRAPING_ERROR;
  error: string;
}

/**
 * Message to set preferences
 */
export interface SetPreferencesMessage extends BaseMessage {
  type: MessageType.SET_PREFERENCES;
  preferences: UserPreferences;
}

/**
 * Transcription result from Lambda API
 */
export interface TranscriptionResult {
  text: string;
  language: string;
  durationSeconds: number;
}

/**
 * Union type for all messages
 */
export type ExtensionMessage =
  | BaseMessage
  | StartScrapingMessage
  | ScrapingProgressMessage
  | ScrapingCompleteMessage
  | ScrapingErrorMessage
  | SetPreferencesMessage;
