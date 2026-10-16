import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
