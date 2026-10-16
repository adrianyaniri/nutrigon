import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BranchProductStatus, SaleUnit } from '@nutrigon/contracts';
import { BranchProductsController } from './branch-products.controller.js';
import type { BranchProductsService } from './branch-products.service.js';
import type {
  UpsertBranchProductDto,
  BranchProductQueryDto,
} from './dto/branch-product.dto.js';

describe('BranchProductsController (TDD)', () => {
  let controller: BranchProductsController;
  let mockService: Partial<Record<keyof BranchProductsService, ReturnType<typeof vi.fn>>>;

  const BRANCH_ID = '11111111-1111-4111-8111-111111111111';
  const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
  const CATEGORY_ID = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    mockService = {
      listForBranch: vi.fn(),
      countByStatus: vi.fn(),
      upsert: vi.fn(),
      getPublicCatalog: vi.fn(),
    };
    controller = new BranchProductsController(
      mockService as unknown as BranchProductsService,
    );
  });

  describe('getPublicCatalog', () => {
    it('delegates to service.getPublicCatalog with slug and query', async () => {
      const query: BranchProductQueryDto = { search: 'almendras', page: 1, limit: 20 };
      const catalogPage = {
        items: [
          {
            id: PRODUCT_ID,
            name: 'Almendras Non Pareil',
            description: null,
            categoryId: CATEGORY_ID,
            categoryName: 'Frutos Secos',
            saleUnit: SaleUnit.WEIGHT,
            price: 5000,
            promotionalPrice: null,
            isOnSale: false,
            priceUnitLabel: 'kg',
            imageUrls: [],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockService.getPublicCatalog!.mockResolvedValue(catalogPage);

      const result = await controller.getPublicCatalog('sucursal-centro', query);

      expect(mockService.getPublicCatalog).toHaveBeenCalledWith('sucursal-centro', query);
      expect(result).toEqual(catalogPage);
    });
  });

  describe('listForBranch', () => {
    it('delegates to service.listForBranch with branchId and query', async () => {
      const query: BranchProductQueryDto = { status: BranchProductStatus.UNCONFIGURED };
      const adminPage = {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
      };
      mockService.listForBranch!.mockResolvedValue(adminPage);

      const result = await controller.listForBranch(BRANCH_ID, query);

      expect(mockService.listForBranch).toHaveBeenCalledWith(BRANCH_ID, query);
      expect(result).toEqual(adminPage);
    });
  });

  describe('countByStatus', () => {
    it('delegates to service.countByStatus with branchId', async () => {
      const counts = {
        [BranchProductStatus.ACTIVE]: 10,
        [BranchProductStatus.INACTIVE]: 2,
        [BranchProductStatus.UNCONFIGURED]: 5,
      };
      mockService.countByStatus!.mockResolvedValue(counts);

      const result = await controller.countByStatus(BRANCH_ID);

      expect(mockService.countByStatus).toHaveBeenCalledWith(BRANCH_ID);
      expect(result).toEqual(counts);
    });
  });

  describe('upsert', () => {
    it('delegates to service.upsert with branchId, productId and dto', async () => {
      const dto: UpsertBranchProductDto = {
        price: 5000,
        isAvailable: true,
        isOnSale: false,
      };
      const expected = {
        id: 'bp-uuid-1',
        branchId: BRANCH_ID,
        productId: PRODUCT_ID,
        price: 5000,
        promotionalPrice: null,
        isOnSale: false,
        isAvailable: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      mockService.upsert!.mockResolvedValue(expected);

      const result = await controller.upsert(BRANCH_ID, PRODUCT_ID, dto);

      expect(mockService.upsert).toHaveBeenCalledWith(BRANCH_ID, PRODUCT_ID, dto);
      expect(result).toEqual(expected);
    });
  });
});
