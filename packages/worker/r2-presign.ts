/**
 * AWS Signature Version 4 presigned URL generator for R2 downloads.
 * Extracted from packages/api/providers/r2.provider.ts.
 * Uses crypto.subtle (Node 18+ / Cloudflare Workers).
 * Zero external dependencies.
 */

interface R2PresignConfig {
  accountId: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
}

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(
  key: ArrayBuffer,
  message: string
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(message)
  );
}

async function calculateSignature(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
  stringToSign: string
): Promise<string> {
  const encodedKey = new TextEncoder().encode(`AWS4${secretAccessKey}`);
  let key = new ArrayBuffer(encodedKey.byteLength);
  new Uint8Array(key).set(encodedKey);
  key = await hmacSha256(key, dateStamp);
  key = await hmacSha256(key, region);
  key = await hmacSha256(key, service);
  key = await hmacSha256(key, "aws4_request");

  const signature = await hmacSha256(key, stringToSign);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a time-limited presigned GET URL for an R2 object.
 * @param config  R2 credentials & bucket info
 * @param objectKey  The object key (path) in the bucket
 * @param expiresIn  TTL in seconds (default 900 = 15 min)
 */
export async function generatePresignedDownloadUrl(
  config: R2PresignConfig,
  objectKey: string,
  expiresIn = 900
): Promise<string> {
  const { accessKeyId, secretAccessKey } = config;
  // Use custom domain — already bound to the bucket, so no bucket name in path
  const endpoint = "https://media.delulu.social";
  const region = "auto";
  const service = "s3";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = `/${objectKey}`;
  const canonicalQuerystring = [
    "X-Amz-Algorithm=AWS4-HMAC-SHA256",
    `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=${expiresIn}`,
    "X-Amz-SignedHeaders=host",
  ].join("&");

  const host = new URL(endpoint).host;
  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";

  const canonicalRequest = [
    "GET",
    canonicalUri,
    canonicalQuerystring,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join("\n");

  const signature = await calculateSignature(
    secretAccessKey,
    dateStamp,
    region,
    service,
    stringToSign
  );

  return `${endpoint}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
}
