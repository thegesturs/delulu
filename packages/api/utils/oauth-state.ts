/**
 * OAuth State Token Management
 *
 * Provides edge-compatible utilities for signing and verifying OAuth state parameters
 * using Web Crypto API (works in Cloudflare Workers, Vercel Edge, Node.js)
 */

const STATE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Get signing key from environment variable
 * Uses Web Crypto API for edge runtime compatibility
 */
async function getSigningKey(): Promise<CryptoKey> {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error('OAUTH_STATE_SECRET environment variable not configured');
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);

  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Sign an OAuth state payload
 * Returns a base64url-encoded signed token: {payload}.{signature}
 */
export async function signState(payload: {
  userId: string;
  nonce: string;
  timestamp: number;
}): Promise<string> {
  const key = await getSigningKey();
  const data = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Create HMAC signature
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);

  // Encode signature as base64url
  const signatureArray = new Uint8Array(signature);
  const signatureB64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Encode payload as base64url
  const dataB64 = btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${dataB64}.${signatureB64}`;
}

/**
 * Verify and decode an OAuth state token
 * Throws error if signature is invalid or token is expired
 */
export async function verifyState(state: string): Promise<{
  userId: string;
  nonce: string;
  timestamp: number;
}> {
  try {
    const [dataB64, signatureB64] = state.split('.');
    if (!dataB64 || !signatureB64) {
      throw new Error('Invalid state format');
    }

    // Decode base64url to get payload
    const data = atob(dataB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(data);

    // Validate payload structure
    if (!payload.userId || !payload.nonce || !payload.timestamp) {
      throw new Error('Invalid payload structure');
    }

    // Check expiration
    if (Date.now() - payload.timestamp > STATE_TTL) {
      throw new Error('State token expired');
    }

    // Verify HMAC signature
    const key = await getSigningKey();
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Decode base64url signature
    const signatureArray = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      dataBuffer
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return payload;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`State verification failed: ${errorMessage}`);
  }
}
