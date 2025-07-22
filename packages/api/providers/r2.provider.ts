import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ResultAsync } from 'neverthrow';
import { keys } from '../keys';
import { R2UploadError, R2DownloadError, R2ConfigError } from './r2-errors';

// Types
interface R2SignedUploadResponse {
  uploadUrl: string;
  key: string;
}

export class R2Provider {
  private s3Client: S3Client;
  private bucketName: string;
  private accountId: string;

  constructor() {
    this.accountId = keys().R2_ACCOUNT_ID;
    this.bucketName = keys().R2_BUCKET_NAME;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: keys().R2_ACCESS_KEY_ID,
        secretAccessKey: keys().R2_SECRET_ACCESS_KEY,
      },
    });
  }

  getSignedDownloadUrl(key: string): ResultAsync<string, R2DownloadError> {
    if (!key || key.trim() === '') {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2DownloadError('Key is required for download URL'))
      );
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return ResultAsync.fromPromise(
      getSignedUrl(this.s3Client, command, { expiresIn: 3600 }),
      (error) => new R2DownloadError(`Failed to generate download URL: ${error}`)
    ).map((url) =>
      url.replace(
        `https://delulu-social.${this.accountId}.r2.cloudflarestorage.com`,
        'https://media.delulu.social'
      )
    );
  }

  getSignedUploadUrl(
    key: string,
    contentType: string
  ): ResultAsync<R2SignedUploadResponse, R2UploadError> {
    if (!key || key.trim() === '') {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2UploadError('Key is required for upload URL'))
      );
    }

    if (!contentType || contentType.trim() === '') {
      return ResultAsync.fromSafePromise(
        Promise.reject(new R2UploadError('Content type is required for upload URL'))
      );
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return ResultAsync.fromPromise(
      getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
        signableHeaders: new Set(['content-type']),
      }),
      (error) => new R2UploadError(`Failed to generate upload URL: ${error}`)
    ).map((uploadUrl) => ({
      uploadUrl,
      key,
    }));
  }
}

export const r2Provider = new R2Provider();
