import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriesController } from './categories.controller.js';
import type { CategoriesService } from './categories.service.js';
import type { CategoryEntity } from '../../core/database/schema/categories.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';
import type { UpdateCategoryDto } from './dto/update-category.dto.js';

describe('CategoriesController (TDD)', () => {
  let controller: CategoriesController;
  let mockService: Partial<Record<keyof CategoriesService, any>>;

  beforeEach(() => {
    mockService = {
      findAllActive: vi.fn(),
      findBySlug: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    };
    controller = new CategoriesController(mockService as CategoriesService);
  });

  const mockCategory: CategoryEntity = {
    id: '11111111-2222-3333-4444-555555555555',
    name: 'Frutos Secos',
    slug: 'frutos-secos',
    orderIndex: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('findAll', () => {
    it('should return all active categories for public catalog', async () => {
      mockService.findAllActive.mockResolvedValue([mockCategory]);

      const result = await controller.findAll();

      expect(mockService.findAllActive).toHaveBeenCalled();
      expect(result).toEqual([mockCategory]);
    });
  });

  describe('findBySlug', () => {
    it('should return category by slug', async () => {
      mockService.findBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findBySlug('frutos-secos');

      expect(mockService.findBySlug).toHaveBeenCalledWith('frutos-secos');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('create', () => {
    it('should create new category', async () => {
      const dto: CreateCategoryDto = {
        name: 'Semillas',
        slug: 'semillas',
        orderIndex: 2,
      };
      mockService.create.mockResolvedValue({ ...mockCategory, ...dto });

      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('Semillas');
    });
  });

  describe('update', () => {
    it('should update category by id', async () => {
      const dto: UpdateCategoryDto = {
        orderIndex: 10,
      };
      mockService.update.mockResolvedValue({ ...mockCategory, ...dto });

      const result = await controller.update(mockCategory.id, dto);

      expect(mockService.update).toHaveBeenCalledWith(mockCategory.id, dto);
      expect(result.orderIndex).toBe(10);
    });
  });

  describe('softDelete', () => {
    it('should deactivate category by id', async () => {
      mockService.softDelete.mockResolvedValue({ ...mockCategory, isActive: false });

      const result = await controller.softDelete(mockCategory.id);

      expect(mockService.softDelete).toHaveBeenCalledWith(mockCategory.id);
      expect(result.isActive).toBe(false);
    });
  });
});
