import { v } from 'convex/values';
import { customAlphabet, nanoid } from 'nanoid';

// ID generation utilities
export const UniqueIdsSchema = v.union(
  v.literal('user'),
  v.literal('org'),
  v.literal('post'),
  v.literal('orgUser'),
  v.literal('orgInvite'),
  v.literal('social'),
  v.literal('media'),
  v.literal('session'),
  v.literal('account'),
  v.literal('verification'),
  v.literal('alt_post')
);

export type UniqueIdsType =
  | 'user'
  | 'org'
  | 'post'
  | 'orgUser'
  | 'orgInvite'
  | 'social'
  | 'media'
  | 'session'
  | 'account'
  | 'verification'
  | 'alt_post';

export function createUniqueIds(id: UniqueIdsType, custom?: boolean): string {
  if (custom) {
    const nanoid = customAlphabet('-abcdefghijklmnopqrstuvwxyz1234567890', 14);
    return `${id}-${nanoid()}`;
  }
  return `${id}_${nanoid(11)}`;
}

// Encryption utilities - Note: These would need to be implemented based on your encryption setup
// For now, I'm creating placeholder functions that match the existing API
export async function encryptData(data: string): Promise<string> {
  // TODO: Implement actual encryption
  // This should use the same encryption method as your current PostgreSQL setup
  return data; // Placeholder - replace with actual encryption
}

export async function decryptData(encryptedData: string): Promise<string> {
  // TODO: Implement actual decryption
  // This should use the same decryption method as your current PostgreSQL setup
  return encryptedData; // Placeholder - replace with actual decryption
}

export type SocialType =
  | 'TWITTER'
  | 'LINKEDIN'
  | 'LENS'
  | 'YOUTUBE'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'TIKTOK'
  | 'THREADS'
  | 'PINTEREST'
  | 'FARCASTER'
  | 'BLUESKY';

export type PostStatus =
  | 'SAVED'
  | 'PUBLISHED'
  | 'SCHEDULED'
  | 'DELETED'
  | 'FAILED';

export type PostReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PrivacyStatus = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export type MediaType = 'IMAGE' | 'VIDEO';

// Helper function to convert timestamps
export function timestampToNumber(timestamp: Date): number {
  return timestamp.getTime();
}

export function numberToTimestamp(num: number): Date {
  return new Date(num);
}

// Validation helper for email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to check if a string is a valid URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper to generate current timestamp
export function getCurrentTimestamp(): number {
  return Date.now();
}

// Helper to check if a timestamp is in the future
export function isFutureTimestamp(timestamp: number): boolean {
  return timestamp > Date.now();
}

// Helper to check if a timestamp is in the past
export function isPastTimestamp(timestamp: number): boolean {
  return timestamp < Date.now();
}
