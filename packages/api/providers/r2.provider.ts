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
