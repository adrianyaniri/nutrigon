import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@nutrigon/contracts';
import { MediaController } from './media.controller.js';
import type { MediaService } from './media.service.js';
import type { GetUploadUrlDto } from './dto/get-upload-url.dto.js';

describe('MediaController (TDD)', () => {
  let controller: MediaController;
  let mockService: { generateUploadUrl: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockService = {
      generateUploadUrl: vi.fn(),
    };
    controller = new MediaController(mockService as unknown as MediaService);
  });

  it('delegates to mediaService.generateUploadUrl and returns uploadUrl, publicUrl and key', async () => {
    const dto: GetUploadUrlDto = {
      fileName: 'almendras.webp',
      contentType: 'image/webp',
      folder: 'products',
    };
    const expected = {
      uploadUrl: 'https://r2.cloudflarestorage.com/nutrigon-media/products/uuid.webp',
      publicUrl: 'https://pub-r2.nutrigon.com/products/uuid.webp',
      key: 'products/uuid.webp',
    };
    mockService.generateUploadUrl.mockResolvedValue(expected);

    const result = await controller.generateUploadUrl(dto);

    expect(mockService.generateUploadUrl).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('allows BRANCH_ADMIN to upload to the combos folder but forbids products folder', async () => {
    const branchAdmin = {
      id: 'u-1',
      email: 'branch@nutrigon.com',
      fullName: 'Branch Admin',
      role: Role.BRANCH_ADMIN,
      branchId: 'b-1',
    };

    await expect(
      controller.generateUploadUrl(
        { fileName: 'prod.webp', contentType: 'image/webp', folder: 'products' },
        branchAdmin,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    mockService.generateUploadUrl.mockResolvedValue({
      uploadUrl: 'https://r2/combos/1.webp',
      publicUrl: 'https://pub/combos/1.webp',
      key: 'combos/1.webp',
    });

    const res = await controller.generateUploadUrl(
      { fileName: 'combo.webp', contentType: 'image/webp', folder: 'combos' },
      branchAdmin,
    );
    expect(res.key).toBe('combos/1.webp');
  });

  it('forbids ADMIN_GENERAL from uploading to the combos folder', async () => {
    const generalAdmin = {
      id: 'u-gen',
      email: 'general@nutrigon.com',
      fullName: 'General Admin',
      role: Role.ADMIN_GENERAL,
      branchId: null,
    };

    await expect(
      controller.generateUploadUrl(
        { fileName: 'combo.webp', contentType: 'image/webp', folder: 'combos' },
        generalAdmin,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
