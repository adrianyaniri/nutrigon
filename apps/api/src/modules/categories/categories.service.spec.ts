import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import type { ICategoriesRepository } from './categories.repository.interface.js';
import type { CategoryEntity, NewCategoryEntity } from '../../core/database/schema/categories.js';

class InMemoryCategoriesRepository implements ICategoriesRepository {
  public items: CategoryEntity[] = [];

  async findAllActive(): Promise<CategoryEntity[]> {
    return this.items
      .filter((c) => c.isActive)
      .sort((a, b) => {
        if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
        return a.name.localeCompare(b.name);
      });
  }

  async findAll(): Promise<CategoryEntity[]> {
    return [...this.items].sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      return a.name.localeCompare(b.name);
    });
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const normalized = slug.toLowerCase().trim();
    return this.items.find((c) => c.slug.toLowerCase().trim() === normalized) ?? null;
  }

  async create(data: NewCategoryEntity): Promise<CategoryEntity> {
    const item: CategoryEntity = {
      id: data.id ?? `cat-${Date.now()}-${Math.random()}`,
      name: data.name,
      slug: data.slug.toLowerCase().trim(),
      orderIndex: data.orderIndex ?? 0,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  async update(id: string, data: Partial<NewCategoryEntity>): Promise<CategoryEntity | null> {
    const index = this.items.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = this.items[index]!;
    const updated: CategoryEntity = {
      ...existing,
      ...data,
      slug: data.slug ? data.slug.toLowerCase().trim() : existing.slug,
      updatedAt: new Date(),
    };
    this.items[index] = updated;
    return updated;
  }
}

describe('CategoriesService (TDD)', () => {
  let service: CategoriesService;
  let repo: InMemoryCategoriesRepository;

  beforeEach(() => {
    repo = new InMemoryCategoriesRepository();
    service = new CategoriesService(repo);
  });

  const seedCategory = async (overrides: Partial<NewCategoryEntity> = {}) => {
    return repo.create({
      name: 'Almendras y Nueces',
      slug: 'almendras-y-nueces',
      orderIndex: 1,
      isActive: true,
      ...overrides,
    });
  };

  describe('findAllActive', () => {
    it('should return only active categories sorted by orderIndex then name', async () => {
      await seedCategory({ name: 'Cereales', slug: 'cereales', orderIndex: 2, isActive: true });
      await seedCategory({ name: 'Almendras', slug: 'almendras', orderIndex: 1, isActive: true });
      await seedCategory({ name: 'Inactiva', slug: 'inactiva', orderIndex: 0, isActive: false });

      const result = await service.findAllActive();

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Almendras');
      expect(result[1]!.name).toBe('Cereales');
    });
  });

  describe('findBySlug', () => {
    it('should return active category by slug', async () => {
      const seeded = await seedCategory();

      const result = await service.findBySlug('almendras-y-nueces');

      expect(result.id).toBe(seeded.id);
      expect(result.slug).toBe('almendras-y-nueces');
    });

    it('should throw NotFoundException if slug does not exist', async () => {
      await expect(service.findBySlug('inexistente')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if category is inactive', async () => {
      await seedCategory({ slug: 'inactiva', isActive: false });

      await expect(service.findBySlug('inactiva')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a category with orderIndex and slug', async () => {
      const created = await service.create({
        name: 'Harinas y Féculas',
        slug: 'harinas-y-feculas',
        orderIndex: 5,
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Harinas y Féculas');
      expect(created.slug).toBe('harinas-y-feculas');
      expect(created.orderIndex).toBe(5);
      expect(created.isActive).toBe(true);
    });

    it('should throw ConflictException if slug already exists', async () => {
      await seedCategory({ slug: 'semillas' });

      await expect(
        service.create({
          name: 'Semillas Varias',
          slug: 'semillas',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update category name and orderIndex successfully', async () => {
      const seeded = await seedCategory();

      const updated = await service.update(seeded.id, {
        name: 'Frutos Secos Premium',
        orderIndex: 10,
      });

      expect(updated.name).toBe('Frutos Secos Premium');
      expect(updated.orderIndex).toBe(10);
    });

    it('should throw NotFoundException if category to update does not exist', async () => {
      await expect(
        service.update('inexistente-id', { name: 'Cambio' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updating slug to an existing category slug', async () => {
      const cat1 = await seedCategory({ slug: 'cat-1' });
      await seedCategory({ slug: 'cat-2' });

      await expect(
        service.update(cat1.id, { slug: 'cat-2' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('should deactivate category setting isActive to false', async () => {
      const seeded = await seedCategory({ isActive: true });

      const deleted = await service.softDelete(seeded.id);

      expect(deleted.isActive).toBe(false);

      const inRepo = await repo.findById(seeded.id);
      expect(inRepo?.isActive).toBe(false);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      await expect(service.softDelete('inexistente-id')).rejects.toThrow(NotFoundException);
    });
  });
});
