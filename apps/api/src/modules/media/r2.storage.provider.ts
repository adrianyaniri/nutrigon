import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  IMediaStorageProvider,
  PresignPutParams,
  PresignedUploadResult,
} from './media.storage.interface.js';

export interface R2StorageConfig {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicUrl?: string;
  nodeEnv?: string;
}

@Injectable()
export class R2StorageProvider implements IMediaStorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly config: R2StorageConfig;
  private s3Client: S3Client | null = null;

  constructor(config?: R2StorageConfig) {
    this.config = config ?? {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucketName: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.R2_PUBLIC_URL,
      nodeEnv: process.env.NODE_ENV,
    };
  }

  private isConfigured(): boolean {
    return Boolean(
      this.config.accountId &&
        this.config.accessKeyId &&
        this.config.secretAccessKey &&
        this.config.bucketName &&
        this.config.publicUrl,
    );
  }

  private getOrCreateClient(): S3Client {
    this.s3Client ??= new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: this.config.accessKeyId!,
        secretAccessKey: this.config.secretAccessKey!,
      },
    });
    return this.s3Client;
  }

  private createDevelopmentFallbackUrl(params: PresignPutParams): PresignedUploadResult {
    this.logger.warn(
      'Cloudflare R2 credentials not set — returning local development mock presigned URL',
    );
    const basePublic = (this.config.publicUrl || 'https://pub-r2.nutrigon.com').replace(
      /\/+$/,
      '',
    );
    const bucket = this.config.bucketName || 'nutrigon-media';

    return {
      uploadUrl: `https://local-r2.nutrigon.dev/${bucket}/${params.key}?X-Amz-Expires=${params.expiresInSeconds}`,
      publicUrl: `${basePublic}/${params.key}`,
    };
  }

  async createPresignedPutUrl(params: PresignPutParams): Promise<PresignedUploadResult> {
    if (!this.isConfigured() && this.config.nodeEnv === 'production') {
      throw new InternalServerErrorException(
        'Cloudflare R2 storage credentials are not configured',
      );
    }

    if (!this.isConfigured()) {
      return this.createDevelopmentFallbackUrl(params);
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucketName!,
      Key: params.key,
      ContentType: params.contentType,
      ContentLength: params.contentLength,
    });

    const uploadUrl = await getSignedUrl(this.getOrCreateClient(), command, {
      expiresIn: params.expiresInSeconds,
    });

    const basePublic = this.config.publicUrl!.replace(/\/+$/, '');

    return {
      uploadUrl,
      publicUrl: `${basePublic}/${params.key}`,
    };
  }
}
