import { describe, it, expect, beforeEach } from 'vitest';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import type {
  IProductsRepository,
  PaginatedResult,
} from './products.repository.interface.js';
import type { ICategoriesRepository } from '../categories/categories.repository.interface.js';
import type {
  ProductEntity,
  NewProductEntity,
} from '../../core/database/schema/products.js';
import type { CategoryEntity } from '../../core/database/schema/categories.js';
import type { ProductQueryDto } from './dto/product.dto.js';
import { SaleUnit } from '@nutrigon/contracts';

class InMemoryProductsRepository implements IProductsRepository {
  public items: ProductEntity[] = [];

  async findMany(
    query: ProductQueryDto,
  ): Promise<PaginatedResult<ProductEntity>> {
    let filtered = [...this.items];

    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(s));
    }
    if (query.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === query.categoryId);
    }
    if (query.code) {
      filtered = filtered.filter((p) => p.code === query.code);
    }
    if (typeof query.isActive === 'boolean') {
      filtered = filtered.filter((p) => p.isActive === query.isActive);
    }

    const total = filtered.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const paginatedItems = filtered.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<ProductEntity | null> {
    return this.items.find((p) => p.id === id) ?? null;
  }

  async findByCode(code: string): Promise<ProductEntity | null> {
    return this.items.find((p) => p.code === code) ?? null;
  }

  async create(data: NewProductEntity): Promise<ProductEntity> {
    const item: ProductEntity = {
      id: data.id ?? `prod-${Date.now()}-${Math.random()}`,
      categoryId: data.categoryId,
      code: data.code ?? null,
      barcode: data.barcode ?? null,
      name: data.name,
      description: data.description ?? null,
      saleUnit: data.saleUnit,
      weightOptionsGrams: data.weightOptionsGrams ?? [100, 250, 500, 1000],
      defaultWeightGrams: data.defaultWeightGrams ?? 250,
      priceReferenceGrams: data.priceReferenceGrams ?? 1000,
      imageUrls: data.imageUrls ?? [],
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  async update(
    id: string,
    data: Partial<NewProductEntity>,
  ): Promise<ProductEntity | null> {
    const index = this.items.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.items[index]!;
    const updated: ProductEntity = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.items[index] = updated;
    return updated;
  }

  async softDelete(id: string): Promise<ProductEntity | null> {
    const index = this.items.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.items[index]!;
    const updated: ProductEntity = {
      ...existing,
      isActive: false,
      updatedAt: new Date(),
    };
    this.items[index] = updated;
    return updated;
  }
}

class InMemoryCategoriesRepository implements Partial<ICategoriesRepository> {
  public categories: CategoryEntity[] = [];

  async findById(id: string): Promise<CategoryEntity | null> {
    return this.categories.find((c) => c.id === id) ?? null;
  }
}

describe('ProductsService (TDD)', () => {
  let service: ProductsService;
  let productsRepo: InMemoryProductsRepository;
  let categoriesRepo: InMemoryCategoriesRepository;

  const validCategory: CategoryEntity = {
    id: 'cat-uuid-1',
    name: 'Frutos Secos',
    slug: 'frutos-secos',
    orderIndex: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    productsRepo = new InMemoryProductsRepository();
    categoriesRepo = new InMemoryCategoriesRepository();
    categoriesRepo.categories = [validCategory];
    service = new ProductsService(
      productsRepo,
      categoriesRepo as ICategoriesRepository,
    );
  });

  const seedProduct = async (overrides: Partial<NewProductEntity> = {}) => {
    return productsRepo.create({
      categoryId: validCategory.id,
      name: 'Nuez Mariposa Blanca',
      saleUnit: SaleUnit.WEIGHT,
      code: '101',
      description: 'Nuez mariposa extra blanca premium',
      imageUrls: [],
      isActive: true,
      ...overrides,
    });
  };

  describe('findMany', () => {
    it('should paginate and filter products by search query', async () => {
      await seedProduct({ name: 'Nuez Mariposa' });
      await seedProduct({ name: 'Almendras Non Pareil' });
      await seedProduct({ name: 'Castañas de Cajú' });

      const result = await service.findMany({
        search: 'nuez',
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe('Nuez Mariposa');
      expect(result.total).toBe(1);
    });

    it('should filter by categoryId', async () => {
      await seedProduct({ name: 'Nuez', categoryId: validCategory.id });
      await seedProduct({ name: 'Harina', categoryId: 'other-cat-id' });

      const result = await service.findMany({ categoryId: validCategory.id });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe('Nuez');
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      const seeded = await seedProduct();

      const result = await service.findById(seeded.id);

      expect(result.id).toBe(seeded.id);
      expect(result.name).toBe(seeded.name);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('persists spice settings with a per-100-g price reference', async () => {
      const settings = {
        weightOptionsGrams: [25, 50, 75, 100],
        defaultWeightGrams: 25,
        priceReferenceGrams: 100 as const,
      };
      const created = await service.create({
        categoryId: validCategory.id,
        name: 'Canela',
        saleUnit: SaleUnit.WEIGHT,
        imageUrls: [],
        ...settings,
      });
      expect(created).toMatchObject(settings);
    });
    it('should create master product when category exists', async () => {
      const created = await service.create({
        categoryId: validCategory.id,
        name: 'Pistachos Tostados',
        saleUnit: SaleUnit.WEIGHT,
        code: '202',
        imageUrls: [],
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Pistachos Tostados');
      expect(created.isActive).toBe(true);
    });

    it('should throw BadRequestException if category does not exist', async () => {
      await expect(
        service.create({
          categoryId: 'non-existent-cat',
          name: 'Pistachos',
          saleUnit: SaleUnit.WEIGHT,
          imageUrls: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if category is inactive', async () => {
      categoriesRepo.categories.push({
        ...validCategory,
        id: 'inactive-cat',
        isActive: false,
      });

      await expect(
        service.create({
          categoryId: 'inactive-cat',
          name: 'Pistachos',
          saleUnit: SaleUnit.WEIGHT,
          imageUrls: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if product code already exists', async () => {
      await seedProduct({ code: 'COD-123' });

      await expect(
        service.create({
          categoryId: validCategory.id,
          name: 'Otro Producto',
          saleUnit: SaleUnit.UNIT,
          code: 'COD-123',
          imageUrls: [],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('rejects a partial default outside persisted weights without modifying data', async () => {
      const seeded = await seedProduct();
      const before = structuredClone(productsRepo.items);
      await expect(
        service.update(seeded.id, { defaultWeightGrams: 25 }),
      ).rejects.toThrow(BadRequestException);
      expect(productsRepo.items).toEqual(before);
    });

    it('rejects weights that exclude the persisted default', async () => {
      const seeded = await seedProduct();
      await expect(
        service.update(seeded.id, { weightOptionsGrams: [25, 50] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a coordinated change of weights and default', async () => {
      const seeded = await seedProduct();
      expect(
        await service.update(seeded.id, {
          weightOptionsGrams: [25, 50],
          defaultWeightGrams: 25,
        }),
      ).toMatchObject({ weightOptionsGrams: [25, 50], defaultWeightGrams: 25 });
    });
    it('should update product successfully', async () => {
      const seeded = await seedProduct();

      const updated = await service.update(seeded.id, {
        name: 'Nuez Mariposa Dorada',
        description: 'Nueva descripción',
      });

      expect(updated.name).toBe('Nuez Mariposa Dorada');
      expect(updated.description).toBe('Nueva descripción');
    });

    it('should throw NotFoundException if product to update is not found', async () => {
      await expect(
        service.update('missing-id', { name: 'Cambio' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updating to an existing code', async () => {
      const prod1 = await seedProduct({ code: 'COD-1' });
      await seedProduct({ code: 'COD-2' });

      await expect(service.update(prod1.id, { code: 'COD-2' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('softDelete', () => {
    it('should deactivate product (soft-delete)', async () => {
      const seeded = await seedProduct();

      const deleted = await service.softDelete(seeded.id);

      expect(deleted.isActive).toBe(false);

      const inRepo = await productsRepo.findById(seeded.id);
      expect(inRepo?.isActive).toBe(false);
    });

    it('should throw NotFoundException if product to delete is not found', async () => {
      await expect(service.softDelete('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
