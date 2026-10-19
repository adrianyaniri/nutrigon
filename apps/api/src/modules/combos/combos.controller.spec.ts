import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombosController } from './combos.controller.js';
import type { CombosService } from './combos.service.js';
import type { CreateComboDto, UpdateComboDto } from './dto/combo.dto.js';

describe('CombosController (TDD)', () => {
  let controller: CombosController;
  let mockService: Partial<Record<keyof CombosService, ReturnType<typeof vi.fn>>>;

  const BRANCH_ID = '11111111-1111-4111-8111-111111111111';
  const COMBO_ID = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    mockService = {
      listPublicForBranch: vi.fn(),
      listForBranch: vi.fn(),
      createForBranch: vi.fn(),
      updateForBranch: vi.fn(),
      softDeleteForBranch: vi.fn(),
    };
    controller = new CombosController(mockService as unknown as CombosService);
  });

  it('lists public combos by branch slug', async () => {
    mockService.listPublicForBranch!.mockResolvedValue([]);
    const res = await controller.listPublicForBranch('origone');
    expect(mockService.listPublicForBranch).toHaveBeenCalledWith('origone');
    expect(res).toEqual([]);
  });

  it('lists admin combos by branchId', async () => {
    mockService.listForBranch!.mockResolvedValue([]);
    const res = await controller.listForBranch(BRANCH_ID);
    expect(mockService.listForBranch).toHaveBeenCalledWith(BRANCH_ID);
    expect(res).toEqual([]);
  });

  it('creates a combo for a branch', async () => {
    const dto: CreateComboDto = {
      name: 'Mix Energía',
      price: 9000,
      imageUrls: [],
      items: [
        { productId: '22222222-2222-4222-8222-222222222221', quantity: 0.5 },
        { productId: '22222222-2222-4222-8222-222222222222', quantity: 0.5 },
      ],
    };
    mockService.createForBranch!.mockResolvedValue({ id: COMBO_ID, ...dto });

    const res = await controller.createForBranch(BRANCH_ID, dto);
    expect(mockService.createForBranch).toHaveBeenCalledWith(BRANCH_ID, dto);
    expect(res.id).toBe(COMBO_ID);
  });

  it('updates a combo for a branch', async () => {
    const dto: UpdateComboDto = { price: 9500 };
    mockService.updateForBranch!.mockResolvedValue({ id: COMBO_ID, price: 9500 });

    const res = await controller.updateForBranch(BRANCH_ID, COMBO_ID, dto);
    expect(mockService.updateForBranch).toHaveBeenCalledWith(BRANCH_ID, COMBO_ID, dto);
    expect(res.price).toBe(9500);
  });

  it('soft deletes a combo for a branch', async () => {
    mockService.softDeleteForBranch!.mockResolvedValue({ id: COMBO_ID, isActive: false });

    const res = await controller.softDeleteForBranch(BRANCH_ID, COMBO_ID);
    expect(mockService.softDeleteForBranch).toHaveBeenCalledWith(BRANCH_ID, COMBO_ID);
    expect(res.isActive).toBe(false);
  });
});
