import { describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service.js';
import type {
  IMediaStorageProvider,
  PresignPutParams,
  PresignedUploadResult,
} from './media.storage.interface.js';

class FakeMediaStorageProvider implements IMediaStorageProvider {
  public lastParams: PresignPutParams | null = null;

  async createPresignedPutUrl(params: PresignPutParams): Promise<PresignedUploadResult> {
    this.lastParams = params;
    return {
      uploadUrl: `https://r2-account.r2.cloudflarestorage.com/nutrigon-media/${params.key}?X-Amz-Expires=${params.expiresInSeconds}`,
      publicUrl: `https://pub-r2.nutrigon.com/${params.key}`,
    };
  }
}

describe('MediaService (TDD)', () => {
  let service: MediaService;
  let storageProvider: FakeMediaStorageProvider;

  beforeEach(() => {
    storageProvider = new FakeMediaStorageProvider();
    service = new MediaService(storageProvider);
  });

  it('generates a presigned upload URL and public URL with UUID key for WebP', async () => {
    const result = await service.generateUploadUrl({
      fileName: 'almendras-nonpareil.webp',
      contentType: 'image/webp',
      folder: 'products',
    });

    expect(result.key).toMatch(
      /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/,
    );
    expect(result.publicUrl).toBe(`https://pub-r2.nutrigon.com/${result.key}`);
    expect(result.uploadUrl).toContain(result.key);
    expect(storageProvider.lastParams).toEqual({
      key: result.key,
      contentType: 'image/webp',
      expiresInSeconds: 300,
    });
  });

  it('normalizes .jpeg and .JPG extensions to lowercase .jpg when contentType is image/jpeg', async () => {
    const res1 = await service.generateUploadUrl({
      fileName: 'FOTO.JPEG',
      contentType: 'image/jpeg',
      folder: 'combos',
    });
    expect(res1.key).toMatch(/^combos\/[0-9a-f-]{36}\.jpg$/);

    const res2 = await service.generateUploadUrl({
      fileName: 'foto.JPG',
      contentType: 'image/jpeg',
      folder: 'categories',
    });
    expect(res2.key).toMatch(/^categories\/[0-9a-f-]{36}\.jpg$/);
  });

  it('supports .png with image/png', async () => {
    const result = await service.generateUploadUrl({
      fileName: 'logo-transparente.png',
      contentType: 'image/png',
      folder: 'products',
    });

    expect(result.key).toMatch(/^products\/[0-9a-f-]{36}\.png$/);
    expect(storageProvider.lastParams?.contentType).toBe('image/png');
  });

  it('rejects requests where file extension does not match contentType', async () => {
    await expect(
      service.generateUploadUrl({
        fileName: 'producto.png',
        contentType: 'image/webp',
        folder: 'products',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.generateUploadUrl({
        fileName: 'producto.webp',
        contentType: 'image/jpeg',
        folder: 'products',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
