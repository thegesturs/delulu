import { v } from 'convex/values';
import {} from 'nanoid';

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

/**
 * Converts a string to an ArrayBuffer
 */
function str2ab(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Converts an ArrayBuffer to a string
 */
function ab2str(buf: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buf);
}

/**
 * Converts an ArrayBuffer to a base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a base64 string to an ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an encryption key from a password using PBKDF2
 */
async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2ab(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM with a random salt
 */
export async function encryptData(data: string): Promise<string> {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await getKey(process.env.BETTER_AUTH_SECRET!, salt);

  // Encrypt the data
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    str2ab(data)
  );

  // Combine salt, IV and encrypted data
  const combined = new Uint8Array(
    salt.length + iv.length + new Uint8Array(encryptedData).length
  );
  combined.set(salt); // First 16 bytes: salt
  combined.set(iv, salt.length); // Next 12 bytes: IV
  combined.set(new Uint8Array(encryptedData), salt.length + iv.length); // Rest: encrypted data

  // Convert to base64 using Web APIs
  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedData: string): Promise<string> {
  // Convert from base64 using Web APIs
  const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

  // Extract salt (first 16 bytes), IV (next 12 bytes) and data (rest)
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  // Generate key using the extracted salt
  const key = await getKey(process.env.BETTER_AUTH_SECRET!, salt);

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );

  return ab2str(decryptedData);
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
  | 'BLUESKY'
  | 'DEFAULT';

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
