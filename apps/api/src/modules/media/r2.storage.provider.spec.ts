import { describe, it, expect } from 'vitest';
import { InternalServerErrorException } from '@nestjs/common';
import { R2StorageProvider } from './r2.storage.provider.js';

describe('R2StorageProvider (TDD)', () => {
  it('signs a real S3 presigned PUT URL when R2 credentials are provided', async () => {
    const provider = new R2StorageProvider({
      accountId: 'test-account-123',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      bucketName: 'nutrigon-media',
      publicUrl: 'https://media.nutrigon.com/',
      nodeEnv: 'production',
    });

    const result = await provider.createPresignedPutUrl({
      key: 'products/123e4567-e89b-12d3-a456-426614174000.webp',
      contentType: 'image/webp',
      expiresInSeconds: 300,
    });

    expect(result.uploadUrl).toContain(
      'https://test-account-123.r2.cloudflarestorage.com/nutrigon-media/products/123e4567-e89b-12d3-a456-426614174000.webp',
    );
    expect(result.uploadUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(result.uploadUrl).toContain('X-Amz-Expires=300');
    expect(result.publicUrl).toBe(
      'https://media.nutrigon.com/products/123e4567-e89b-12d3-a456-426614174000.webp',
    );
  });

  it('returns deterministic mock URLs in non-production when R2 credentials are missing', async () => {
    const provider = new R2StorageProvider({
      nodeEnv: 'development',
    });

    const result = await provider.createPresignedPutUrl({
      key: 'products/sample.webp',
      contentType: 'image/webp',
      expiresInSeconds: 300,
    });

    expect(result.uploadUrl).toBe(
      'https://local-r2.nutrigon.dev/nutrigon-media/products/sample.webp?X-Amz-Expires=300',
    );
    expect(result.publicUrl).toBe('https://pub-r2.nutrigon.com/products/sample.webp');
  });

  it('throws InternalServerErrorException in production when R2 credentials are missing', async () => {
    const provider = new R2StorageProvider({
      nodeEnv: 'production',
    });

    await expect(
      provider.createPresignedPutUrl({
        key: 'products/sample.webp',
        contentType: 'image/webp',
        expiresInSeconds: 300,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
