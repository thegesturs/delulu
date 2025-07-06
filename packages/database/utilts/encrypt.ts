import { keys } from './keys';

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
 * Derives an encryption key from a password using PBKDF2
 */
async function getKey(password: string): Promise<CryptoKey> {
  const salt = str2ab('delulu-social'); // Using a static salt since we're using a strong secret
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
 * Encrypts data using AES-GCM
 */
export async function encryptData(data: string): Promise<string> {
  const key = await getKey(keys().BETTER_AUTH_SECRET);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    str2ab(data)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(
    iv.length + new Uint8Array(encryptedData).length
  );
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedData: string): Promise<string> {
  const key = await getKey(keys().BETTER_AUTH_SECRET);

  // Convert from base64 and split IV and data
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

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
