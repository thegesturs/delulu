"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// ============================================================================
// AWS Signature V4 helpers (same pattern as packages/worker/r2-presign.ts)
// ============================================================================

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
  const encoder = new TextEncoder();
  let key: ArrayBuffer = encoder.encode(`AWS4${secretAccessKey}`).buffer;
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
 * Generate a presigned DELETE URL for an R2 object.
 */
async function generatePresignedDeleteUrl(
  config: {
    accountId: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
  },
  objectKey: string,
  expiresIn = 900
): Promise<string> {
  const { accountId, bucketName, accessKeyId, secretAccessKey } = config;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalUri = `/${bucketName}/${objectKey}`;
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
    "DELETE",
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

// ============================================================================
// Convex action
// ============================================================================

/**
 * Delete video files from R2 storage.
 * Called by CallMeLater 7 days after a post is published.
 */
export const deleteVideosFromR2 = internalAction({
  args: {
    bucketKeys: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucketName = process.env.R2_BUCKET_NAME;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!(accountId && bucketName && accessKeyId && secretAccessKey)) {
      console.error("R2 environment variables not set, skipping video cleanup");
      return null;
    }

    const config = { accountId, bucketName, accessKeyId, secretAccessKey };

    for (const key of args.bucketKeys) {
      try {
        const deleteUrl = await generatePresignedDeleteUrl(config, key);
        const response = await fetch(deleteUrl, { method: "DELETE" });

        if (response.ok || response.status === 404) {
          console.log(`[R2 Cleanup] Deleted: ${key}`);
        } else {
          console.error(
            `[R2 Cleanup] Failed to delete ${key}: ${response.status}`
          );
        }
      } catch (error) {
        console.error(`[R2 Cleanup] Error deleting ${key}:`, error);
      }
    }

    return null;
  },
});
