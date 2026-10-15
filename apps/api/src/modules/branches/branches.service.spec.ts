import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import type { IBranchesRepository } from './branches.repository.interface.js';
import type { BranchEntity, NewBranchEntity } from '../../core/database/schema/branches.js';

class InMemoryBranchesRepository implements IBranchesRepository {
  public items: BranchEntity[] = [];

  async findAllActive(): Promise<BranchEntity[]> {
    return this.items
      .filter((b) => b.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findAll(): Promise<BranchEntity[]> {
    return [...this.items].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: string): Promise<BranchEntity | null> {
    return this.items.find((b) => b.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<BranchEntity | null> {
    const normalized = slug.toLowerCase().trim();
    return this.items.find((b) => b.slug.toLowerCase().trim() === normalized) ?? null;
  }

  async create(data: NewBranchEntity): Promise<BranchEntity> {
    const item: BranchEntity = {
      id: data.id ?? `uuid-${Date.now()}-${Math.random()}`,
      name: data.name,
      slug: data.slug.toLowerCase().trim(),
      address: data.address ?? null,
      phone: data.phone ?? null,
      whatsappNumber: data.whatsappNumber ?? null,
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(item);
    return item;
  }

  async update(id: string, data: Partial<NewBranchEntity>): Promise<BranchEntity | null> {
    const index = this.items.findIndex((b) => b.id === id);
    if (index === -1) return null;

    const existing = this.items[index]!;
    const updated: BranchEntity = {
      ...existing,
      ...data,
      slug: data.slug ? data.slug.toLowerCase().trim() : existing.slug,
      updatedAt: new Date(),
    };
    this.items[index] = updated;
    return updated;
  }
}

describe('BranchesService (TDD)', () => {
  let service: BranchesService;
  let repo: InMemoryBranchesRepository;

  beforeEach(() => {
    repo = new InMemoryBranchesRepository();
    service = new BranchesService(repo);
  });

  const seedBranch = async (overrides: Partial<NewBranchEntity> = {}) => {
    return repo.create({
      name: 'Origone',
      slug: 'origone',
      address: 'Origone 123',
      phone: '1122334455',
      whatsappNumber: '5491122334455',
      isActive: true,
      ...overrides,
    });
  };

  describe('findAllActive', () => {
    it('should return only active branches sorted by name', async () => {
      await seedBranch({ name: 'W Morris', slug: 'w-morris', isActive: true });
      await seedBranch({ name: 'Origone', slug: 'origone', isActive: true });
      await seedBranch({ name: 'Sucursal Cerrada', slug: 'cerrada', isActive: false });

      const result = await service.findAllActive();

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Origone');
      expect(result[1]!.name).toBe('W Morris');
    });
  });

  describe('findBySlug', () => {
    it('should return active branch by slug', async () => {
      const seeded = await seedBranch();

      const result = await service.findBySlug('origone');

      expect(result.id).toBe(seeded.id);
      expect(result.slug).toBe('origone');
    });

    it('should throw NotFoundException if slug does not exist', async () => {
      await expect(service.findBySlug('inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if branch is inactive', async () => {
      await seedBranch({ slug: 'inactiva', isActive: false });

      await expect(service.findBySlug('inactiva')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a branch successfully', async () => {
      const created = await service.create({
        name: 'Pedro Diaz',
        slug: 'pedro-diaz',
        address: 'Av. Pedro Diaz 456',
        whatsappNumber: '5491144332211',
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Pedro Diaz');
      expect(created.slug).toBe('pedro-diaz');
      expect(created.isActive).toBe(true);
    });

    it('should throw ConflictException if slug already exists', async () => {
      await seedBranch({ slug: 'origone' });

      await expect(
        service.create({
          name: 'Otra Origone',
          slug: 'origone',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update branch contact info successfully', async () => {
      const seeded = await seedBranch();

      const updated = await service.update(seeded.id, {
        whatsappNumber: '5491199887766',
        address: 'Nueva Direccion 789',
      });

      expect(updated.whatsappNumber).toBe('5491199887766');
      expect(updated.address).toBe('Nueva Direccion 789');
    });

    it('should throw NotFoundException if branch to update does not exist', async () => {
      await expect(
        service.update('inexistente-id', { address: 'Calle Falsa 123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if updating slug to another existing branch slug', async () => {
      const branch1 = await seedBranch({ slug: 'sucursal-1' });
      await seedBranch({ slug: 'sucursal-2' });

      await expect(
        service.update(branch1.id, { slug: 'sucursal-2' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('should deactivate branch setting isActive to false', async () => {
      const seeded = await seedBranch({ isActive: true });

      const deleted = await service.softDelete(seeded.id);

      expect(deleted.isActive).toBe(false);

      const inRepo = await repo.findById(seeded.id);
      expect(inRepo?.isActive).toBe(false);
    });

    it('should throw NotFoundException if branch does not exist', async () => {
      await expect(service.softDelete('inexistente-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
