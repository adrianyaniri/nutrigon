import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsController } from './products.controller.js';
import type { ProductsService } from './products.service.js';
import type { ProductEntity } from '../../core/database/schema/products.js';
import type { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto/product.dto.js';
import { SaleUnit } from '@nutrigon/contracts';

describe('ProductsController (TDD)', () => {
  let controller: ProductsController;
  let mockService: Partial<Record<keyof ProductsService, any>>;

  beforeEach(() => {
    mockService = {
      findMany: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    controller = new ProductsController(mockService as ProductsService);
  });

  const mockProduct: ProductEntity = {
    id: 'prod-uuid-1',
    categoryId: 'cat-uuid-1',
    code: '101',
    barcode: null,
    name: 'Almendras Non Pareil',
    description: 'Calidad superior',
    saleUnit: SaleUnit.WEIGHT,
    imageUrls: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findMany', () => {
    it('should call service.findMany and return paginated products', async () => {
      const query: ProductQueryDto = { search: 'almendras', page: 1, limit: 10 };
      const paginated = {
        items: [mockProduct],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockService.findMany.mockResolvedValue(paginated);

      const result = await controller.findMany(query);

      expect(mockService.findMany).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginated);
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      mockService.findById.mockResolvedValue(mockProduct);

      const result = await controller.findById(mockProduct.id);

      expect(mockService.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('create', () => {
    it('should create new product', async () => {
      const dto: CreateProductDto = {
        categoryId: 'cat-uuid-1',
        name: 'Nueces Pecan',
        saleUnit: SaleUnit.WEIGHT,
        imageUrls: [],
      };
      mockService.create.mockResolvedValue({ ...mockProduct, ...dto });

      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('Nueces Pecan');
    });
  });

  describe('update', () => {
    it('should update product by id', async () => {
      const dto: UpdateProductDto = {
        name: 'Almendras Tostadas',
      };
      mockService.update.mockResolvedValue({ ...mockProduct, ...dto });

      const result = await controller.update(mockProduct.id, dto);

      expect(mockService.update).toHaveBeenCalledWith(mockProduct.id, dto);
      expect(result.name).toBe('Almendras Tostadas');
    });
  });

  describe('softDelete', () => {
    it('should soft delete product by id', async () => {
      mockService.softDelete.mockResolvedValue({ ...mockProduct, isActive: false });

      const result = await controller.softDelete(mockProduct.id);

      expect(mockService.softDelete).toHaveBeenCalledWith(mockProduct.id);
      expect(result.isActive).toBe(false);
    });
  });
});
