import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SaleUnit } from '@nutrigon/contracts';
import { CombosService } from './combos.service.js';
import type {
  ICombosRepository,
  BranchComboRecord,
  CreateBranchComboData,
  UpdateBranchComboData,
} from './combos.repository.interface.js';
import type { IBranchesRepository } from '../branches/branches.repository.interface.js';
import type { IProductsRepository } from '../products/products.repository.interface.js';
import type { BranchEntity } from '../../core/database/schema/branches.js';
import type { ProductEntity } from '../../core/database/schema/products.js';

const BRANCH_ID = '11111111-1111-4111-8111-111111111111';
const PROD_1 = '22222222-2222-4222-8222-222222222221';
const PROD_2 = '22222222-2222-4222-8222-222222222222';
const CAT_ID = '33333333-3333-4333-8333-333333333333';

class FakeCombosRepository implements ICombosRepository {
  public records: BranchComboRecord[] = [];
  private productsMap = new Map<string, { name: string; saleUnit: SaleUnit }>();

  constructor(products: ProductEntity[]) {
    for (const p of products) {
      this.productsMap.set(p.id, { name: p.name, saleUnit: p.saleUnit as SaleUnit });
    }
  }

  async findByBranch(branchId: string): Promise<BranchComboRecord[]> {
    return this.records.filter((r) => r.branchId === branchId && r.isActive);
  }

  async findPublishedByBranch(branchId: string): Promise<BranchComboRecord[]> {
    return this.records.filter(
      (r) => r.branchId === branchId && r.isActive && r.isAvailable,
    );
  }

  async findByIdAndBranch(
    comboId: string,
    branchId: string,
  ): Promise<BranchComboRecord | null> {
    return (
      this.records.find(
        (r) => r.id === comboId && r.branchId === branchId && r.isActive,
      ) ?? null
    );
  }

  async create(data: CreateBranchComboData): Promise<BranchComboRecord> {
    const record: BranchComboRecord = {
      id: `combo-${this.records.length + 1}`,
      branchId: data.branchId,
      name: data.name,
      description: data.description,
      imageUrls: data.imageUrls,
      price: data.price,
      isAvailable: data.isAvailable,
      isActive: true,
      items: data.items.map((item) => {
        const meta = this.productsMap.get(item.productId) ?? {
          name: 'Unknown',
          saleUnit: SaleUnit.UNIT,
        };
        return {
          productId: item.productId,
          productName: meta.name,
          quantity: item.quantity,
          saleUnit: meta.saleUnit,
        };
      }),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    this.records.push(record);
    return record;
  }

  async update(
    comboId: string,
    branchId: string,
    data: UpdateBranchComboData,
  ): Promise<BranchComboRecord | null> {
    const idx = this.records.findIndex(
      (r) => r.id === comboId && r.branchId === branchId && r.isActive,
    );
    if (idx === -1) return null;

    const current = this.records[idx]!;
    const updated: BranchComboRecord = {
      ...current,
      name: data.name ?? current.name,
      description: data.description !== undefined ? data.description : current.description,
      imageUrls: data.imageUrls ?? current.imageUrls,
      price: data.price ?? current.price,
      isAvailable: data.isAvailable ?? current.isAvailable,
      items: data.items
        ? data.items.map((item) => {
            const meta = this.productsMap.get(item.productId) ?? {
              name: 'Unknown',
              saleUnit: SaleUnit.UNIT,
            };
            return {
              productId: item.productId,
              productName: meta.name,
              quantity: item.quantity,
              saleUnit: meta.saleUnit,
            };
          })
        : current.items,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    this.records[idx] = updated;
    return updated;
  }

  async softDelete(
    comboId: string,
    branchId: string,
  ): Promise<BranchComboRecord | null> {
    const idx = this.records.findIndex(
      (r) => r.id === comboId && r.branchId === branchId && r.isActive,
    );
    if (idx === -1) return null;

    const current = this.records[idx]!;
    const deleted: BranchComboRecord = {
      ...current,
      isActive: false,
      isAvailable: false,
      updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    };
    this.records[idx] = deleted;
    return deleted;
  }
}

describe('CombosService (TDD)', () => {
  let service: CombosService;
  let repo: FakeCombosRepository;
  let branches: BranchEntity[];
  let products: ProductEntity[];

  beforeEach(() => {
    branches = [
      {
        id: BRANCH_ID,
        name: 'Sucursal Origone',
        slug: 'origone',
        address: 'Origone 123',
        phone: null,
        whatsappNumber: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    products = [
      {
        id: PROD_1,
        categoryId: CAT_ID,
        code: '101',
        barcode: null,
        name: 'Almendras Non Pareil',
        description: null,
        saleUnit: SaleUnit.WEIGHT,
        imageUrls: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: PROD_2,
        categoryId: CAT_ID,
        code: '102',
        barcode: null,
        name: 'Nueces Mariposa',
        description: null,
        saleUnit: SaleUnit.WEIGHT,
        imageUrls: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    repo = new FakeCombosRepository(products);

    const branchesRepo = {
      findById: async (id: string) => branches.find((b) => b.id === id) ?? null,
      findBySlug: async (slug: string) => branches.find((b) => b.slug === slug) ?? null,
    } as unknown as IBranchesRepository;

    const productsRepo = {
      findById: async (id: string) => products.find((p) => p.id === id) ?? null,
    } as unknown as IProductsRepository;

    service = new CombosService(repo, branchesRepo, productsRepo);
  });

  describe('createForBranch', () => {
    it('throws NotFoundException when branch does not exist or is inactive', async () => {
      await expect(
        service.createForBranch('missing', {
          name: 'Mix Energía',
          price: 9500,
          imageUrls: [],
          items: [
            { productId: PROD_1, quantity: 0.5 },
            { productId: PROD_2, quantity: 0.5 },
          ],
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects duplicate products inside the same combo', async () => {
      await expect(
        service.createForBranch(BRANCH_ID, {
          name: 'Combo Duplicado',
          price: 9500,
          imageUrls: [],
          items: [
            { productId: PROD_1, quantity: 0.5 },
            { productId: PROD_1, quantity: 0.5 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-existent or inactive master products', async () => {
      products[1]!.isActive = false;

      await expect(
        service.createForBranch(BRANCH_ID, {
          name: 'Combo Inválido',
          price: 9500,
          imageUrls: [],
          items: [
            { productId: PROD_1, quantity: 0.5 },
            { productId: PROD_2, quantity: 0.5 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a branch combo with formatted price and numeric quantities', async () => {
      const created = await service.createForBranch(BRANCH_ID, {
        name: 'Mix Frutos Secos 1kg',
        description: '500g almendras + 500g nueces',
        price: 12500,
        isAvailable: true,
        imageUrls: [],
        items: [
          { productId: PROD_1, quantity: 0.5 },
          { productId: PROD_2, quantity: 0.5 },
        ],
      });

      expect(created.branchId).toBe(BRANCH_ID);
      expect(created.name).toBe('Mix Frutos Secos 1kg');
      expect(created.price).toBe(12500);
      expect(created.isAvailable).toBe(true);
      expect(created.items).toHaveLength(2);
      expect(created.items[0]).toEqual({
        productId: PROD_1,
        productName: 'Almendras Non Pareil',
        quantity: 0.5,
        saleUnit: SaleUnit.WEIGHT,
      });
    });
  });

  describe('updateForBranch & softDeleteForBranch', () => {
    it('updates price, availability and items for an existing branch combo', async () => {
      const combo = await service.createForBranch(BRANCH_ID, {
        name: 'Combo Original',
        price: 10000,
        imageUrls: [],
        items: [
          { productId: PROD_1, quantity: 1 },
          { productId: PROD_2, quantity: 1 },
        ],
      });

      const updated = await service.updateForBranch(BRANCH_ID, combo.id, {
        name: 'Combo Actualizado',
        price: 11200,
        isAvailable: false,
      });

      expect(updated.name).toBe('Combo Actualizado');
      expect(updated.price).toBe(11200);
      expect(updated.isAvailable).toBe(false);
    });

    it('soft deletes a branch combo and hides it from public catalog', async () => {
      const combo = await service.createForBranch(BRANCH_ID, {
        name: 'Combo Temporal',
        price: 8000,
        isAvailable: true,
        imageUrls: [],
        items: [
          { productId: PROD_1, quantity: 0.25 },
          { productId: PROD_2, quantity: 0.25 },
        ],
      });

      const publicBefore = await service.listPublicForBranch('origone');
      expect(publicBefore).toHaveLength(1);

      const deleted = await service.softDeleteForBranch(BRANCH_ID, combo.id);
      expect(deleted.isActive).toBe(false);
      expect(deleted.isAvailable).toBe(false);

      const publicAfter = await service.listPublicForBranch('origone');
      expect(publicAfter).toHaveLength(0);
    });
  });
});
