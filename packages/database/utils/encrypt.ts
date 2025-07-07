import { keys } from '../keys';

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

  // Generate key using the random salt
  const key = await getKey(keys().BETTER_AUTH_SECRET, salt);

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

  // Convert to base64 using a more robust method
  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypts data using AES-GCM
 */
export async function decryptData(encryptedData: string): Promise<string> {
  // Convert from base64
  const combined = new Uint8Array(Buffer.from(encryptedData, 'base64'));

  // Extract salt (first 16 bytes), IV (next 12 bytes) and data (rest)
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  // Generate key using the extracted salt
  const key = await getKey(keys().BETTER_AUTH_SECRET, salt);

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
