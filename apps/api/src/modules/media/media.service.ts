import { randomUUID } from 'node:crypto';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { UploadUrlResponse } from '@nutrigon/contracts';
import {
  MEDIA_STORAGE_PROVIDER,
  type IMediaStorageProvider,
} from './media.storage.interface.js';
import type { GetUploadUrlDto } from './dto/get-upload-url.dto.js';

const PRESIGN_EXPIRES_IN_SECONDS = 300; // 5 minutes

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const MIME_TO_CANONICAL_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_STORAGE_PROVIDER)
    private readonly storageProvider: IMediaStorageProvider,
  ) {}

  async generateUploadUrl(dto: GetUploadUrlDto): Promise<UploadUrlResponse> {
    const rawExt = dto.fileName.split('.').pop()?.toLowerCase() ?? '';
    const expectedMime = EXTENSION_TO_MIME[rawExt];

    if (!expectedMime || expectedMime !== dto.contentType) {
      throw new BadRequestException(
        `File extension ".${rawExt}" does not match contentType "${dto.contentType}"`,
      );
    }

    const ext = MIME_TO_CANONICAL_EXT[dto.contentType] ?? rawExt;
    const folder = dto.folder ?? 'products';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const { uploadUrl, publicUrl } = await this.storageProvider.createPresignedPutUrl({
      key,
      contentType: dto.contentType,
      expiresInSeconds: PRESIGN_EXPIRES_IN_SECONDS,
    });

    return {
      uploadUrl,
      publicUrl,
      key,
    };
  }
}
