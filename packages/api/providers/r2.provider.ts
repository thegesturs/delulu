import type { R2Bucket } from '@delulu/cloudflare-types';
import { ResultAsync, err, ok } from 'neverthrow';
import { R2DownloadError, R2UploadError } from './r2-errors';

// Types for R2Provider

export class R2Provider {
  private bucket: R2Bucket | null = null;

  constructor(bucket?: R2Bucket) {
    this.bucket = bucket || null;
  }

  setBucket(bucket: R2Bucket) {
    this.bucket = bucket;
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

    // For Cloudflare Workers R2, we use the custom domain directly
    // Since the bucket has public access enabled, we can construct the URL directly
    const downloadUrl = `https://media.delulu.social/${key}`;

    return ResultAsync.fromSafePromise(Promise.resolve(downloadUrl));
  }

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

  // Note: getSignedUploadUrl removed - we use direct uploads through the API instead
}

export const r2Provider = new R2Provider();
