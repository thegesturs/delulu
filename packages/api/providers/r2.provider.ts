import type { R2Bucket } from '@delulu/cloudflare-types';
import { ResultAsync, err, ok } from 'neverthrow';
import { R2DownloadError, R2UploadError } from './r2-errors';
import { keys } from '../keys';

// Types for R2Provider

export class R2Provider {
  private bucket: R2Bucket | null = null;

  constructor(bucket?: R2Bucket) {
    this.bucket = bucket || null;
  }

  setBucket(bucket: R2Bucket) {
    this.bucket = bucket;
  }

  getFile(
    key: string
  ): ResultAsync<
    { content: ArrayBuffer; contentType: string; contentLength?: number },
    R2DownloadError
  > {
    if (!key || key.trim() === '') {
      return ResultAsync.fromSafePromise(
        Promise.reject(
          new R2DownloadError('Key is required for file retrieval')
        )
      );
    }

    if (!this.bucket) {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2DownloadError('R2 bucket not configured'))
      );
    }

    return ResultAsync.fromPromise(
      this.bucket.get(key),
      (error) =>
        new R2DownloadError(`Failed to retrieve file from R2: ${error}`)
    ).andThen((object) => {
      if (!object) {
        return ResultAsync.fromSafePromise(
          Promise.reject(new R2DownloadError('File not found'))
        );
      }

      return ResultAsync.fromPromise(
        object.arrayBuffer(),
        (error) => new R2DownloadError(`Failed to read file content: ${error}`)
      ).map((content) => ({
        content,
        contentType:
          object.httpMetadata?.contentType || 'application/octet-stream',
        contentLength: object.size,
      }));
    });
  }

  getSignedDownloadUrl(key: string): ResultAsync<string, R2DownloadError> {
    if (!key || key.trim() === '') {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2DownloadError('Key is required for download URL'))
      );
    }

    if (!this.bucket) {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2DownloadError('R2 bucket not configured'))
      );
    }

    // Environment-aware URL generation
    const isProduction = process.env.NODE_ENV === 'production';
    const downloadUrl = isProduction
      ? `https://media.delulu.social/${key}`
      : `/api/media/${key}`;

    return ResultAsync.fromSafePromise(Promise.resolve(downloadUrl));
  }

  /**
   * Upload file with streaming (no memory buffering)
   * Accepts File directly - in Cloudflare Workers, this is efficient
   */
  uploadFileStream(
    key: string,
    file: File | ArrayBuffer,
    contentType: string
  ): ResultAsync<
    { success: boolean; key: string; downloadUrl: string },
    R2UploadError
  > {
    if (!this.bucket) {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2UploadError('R2 bucket not configured'))
      );
    }

    // Cast to 'any' to bypass type checking between Node.js and Cloudflare Workers types
    // In actual Cloudflare Workers runtime, File is the correct type for R2
    return ResultAsync.fromPromise(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      this.bucket.put(key, file as any, {
        httpMetadata: {
          contentType: contentType,
        },
        customMetadata: {
          uploadedAt: new Date().toISOString(),
        },
      }),
      (error) => new R2UploadError(`Failed to upload file to R2: ${error}`)
    ).andThen((result) => {
      if (!result) {
        return err(
          new R2UploadError('Upload completed but no result returned')
        );
      }

      const isProduction = process.env.NODE_ENV === 'production';
      const downloadUrl = isProduction
        ? `https://media.delulu.social/${key}`
        : `/api/media/${key}`;

      return ok({
        success: true,
        key: key,
        downloadUrl,
      });
    });
  }

  /**
   * Upload file from ArrayBuffer (legacy method)
   */
  uploadFile(
    key: string,
    file: ArrayBuffer,
    contentType: string
  ): ResultAsync<
    { success: boolean; key: string; downloadUrl: string },
    R2UploadError
  > {
    if (!this.bucket) {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2UploadError('R2 bucket not configured'))
      );
    }

    return ResultAsync.fromPromise(
      this.bucket.put(key, file, {
        httpMetadata: {
          contentType: contentType,
        },
      }),
      (error) => new R2UploadError(`Failed to upload file to R2: ${error}`)
    ).andThen((result) => {
      if (!result) {
        return err(
          new R2UploadError('Upload completed but no result returned')
        );
      }

      return ok({
        success: true,
        key: key,
        downloadUrl: `https://media.delulu.social/${key}`,
      });
    });
  }

  /**
   * Generate presigned URL for direct client uploads to R2
   * Uses Web Crypto API (works in Cloudflare Workers)
   * @param key - The object key in R2
   * @param contentType - MIME type of the file
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
  ): Promise<{ uploadUrl: string; key: string }> {
    const r2Keys = keys();

    const accessKeyId = r2Keys.R2_ACCESS_KEY_ID;
    const secretAccessKey = r2Keys.R2_SECRET_ACCESS_KEY;
    const bucketName = r2Keys.R2_BUCKET_NAME;
    const accountId = r2Keys.R2_ACCOUNT_ID;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    // Generate presigned URL using AWS Signature Version 4
    const uploadUrl = await this.generatePresignedUrl({
      endpoint,
      bucketName,
      key,
      accessKeyId,
      secretAccessKey,
      contentType,
      expiresIn,
      method: 'PUT',
    });

    return { uploadUrl, key };
  }

  /**
   * Generate presigned URL for direct client downloads from R2
   * Uses Web Crypto API (works in Cloudflare Workers)
   * @param key - The object key in R2
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    const r2Keys = keys();

    const accessKeyId = r2Keys.R2_ACCESS_KEY_ID;
    const secretAccessKey = r2Keys.R2_SECRET_ACCESS_KEY;
    const bucketName = r2Keys.R2_BUCKET_NAME;
    const accountId = r2Keys.R2_ACCOUNT_ID;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

    // Generate presigned URL using AWS Signature Version 4
    const downloadUrl = await this.generatePresignedUrl({
      endpoint,
      bucketName,
      key,
      accessKeyId,
      secretAccessKey,
      expiresIn,
      method: 'GET',
    });

    return downloadUrl;
  }

  /**
   * Generate AWS Signature Version 4 presigned URL
   * Compatible with Cloudflare Workers (uses Web Crypto API)
   * Supports both PUT (upload) and GET (download) methods
   */
  private async generatePresignedUrl(params: {
    endpoint: string;
    bucketName: string;
    key: string;
    accessKeyId: string;
    secretAccessKey: string;
    contentType?: string; // Optional, only needed for PUT
    expiresIn: number;
    method: 'PUT' | 'GET';
  }): Promise<string> {
    const {
      endpoint,
      bucketName,
      key,
      accessKeyId,
      secretAccessKey,
      expiresIn,
      method,
    } = params;

    const region = 'auto';
    const service = 's3';

    // Create timestamp
    const now = new Date();
    // biome-ignore lint/nursery/noUselessEscapeInRegex: <explanation>
    const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    // Canonical request components
    const canonicalUri = `/${bucketName}/${key}`;
    const canonicalQuerystring = [
      'X-Amz-Algorithm=AWS4-HMAC-SHA256',
      `X-Amz-Credential=${encodeURIComponent(`${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request`)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expiresIn}`,
      'X-Amz-SignedHeaders=host',
    ].join('&');

    const host = new URL(endpoint).host;
    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    // Create canonical request
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQuerystring,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const canonicalRequestHash = await this.sha256(canonicalRequest);
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    // Calculate signature
    const signature = await this.calculateSignature(
      secretAccessKey,
      dateStamp,
      region,
      service,
      stringToSign
    );

    // Build final URL
    const finalUrl = `${endpoint}${canonicalUri}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;

    return finalUrl;
  }

  /**
   * SHA256 hash using Web Crypto API
   */
  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * HMAC SHA256 using Web Crypto API
   */
  private async hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  }

  /**
   * Calculate AWS Signature V4
   */
  private async calculateSignature(
    secretAccessKey: string,
    dateStamp: string,
    region: string,
    service: string,
    stringToSign: string
  ): Promise<string> {
    const encoder = new TextEncoder();

    // Create signing key
    let key = encoder.encode(`AWS4${secretAccessKey}`).buffer;
    key = await this.hmacSha256(key, dateStamp);
    key = await this.hmacSha256(key, region);
    key = await this.hmacSha256(key, service);
    key = await this.hmacSha256(key, 'aws4_request');

    // Sign the string
    const signature = await this.hmacSha256(key, stringToSign);
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

}

export const r2Provider = new R2Provider();
