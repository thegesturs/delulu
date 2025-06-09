import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { keys } from '../keys';

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

  async getSignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return (await getSignedUrl(this.s3Client, command, { expiresIn: 3600 })).replace(
      `https://delulu-social.${this.accountId}.r2.cloudflarestorage.com`,
      'https://media.delulu.social'
    );
  }

  async getSignedUploadUrl(
    key: string,
    contentType: string
  ): Promise<{
    uploadUrl: string;
    key: string;
  }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
      signableHeaders: new Set(['content-type']), // Ensure content-type is signed
    });

    console.log('uploadUrl', uploadUrl);

    return {
      uploadUrl,
      key,
    };
  }
}

export const r2Provider = new R2Provider();
