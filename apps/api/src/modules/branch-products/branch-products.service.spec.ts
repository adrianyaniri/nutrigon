import { describe, it, expect, beforeEach } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  BranchProductStatus,
  SaleUnit,
  type BranchCatalogCategory,
  type BranchProductCounts,
  type BranchComboCatalogItem,
} from '@nutrigon/contracts';
import { BranchProductsService } from './branch-products.service.js';
import type {
  IBranchProductsRepository,
  BranchProductAdminRow,
  BranchCatalogRow,
  UpsertBranchProductData,
} from './branch-products.repository.interface.js';
import type { PaginatedResult } from '../products/products.repository.interface.js';
import type { IBranchesRepository } from '../branches/branches.repository.interface.js';
import type { IProductsRepository } from '../products/products.repository.interface.js';
import type { CombosService } from '../combos/combos.service.js';
import type { BranchEntity } from '../../core/database/schema/branches.js';
import type { ProductEntity } from '../../core/database/schema/products.js';
import type { BranchProductEntity } from '../../core/database/schema/branch-products.js';
import type { BranchProductQueryDto } from './dto/branch-product.dto.js';

const BRANCH_ID = '11111111-1111-4111-8111-111111111111';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
const CATEGORY_ID = '33333333-3333-4333-8333-333333333333';

const makeBranch = (overrides: Partial<BranchEntity> = {}): BranchEntity => ({
  id: BRANCH_ID,
  name: 'Centro',
  slug: 'centro',
  address: 'Av. Principal 123',
  phone: '11-1234-5678',
  whatsappNumber: '5491112345678',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeProduct = (
  overrides: Partial<ProductEntity> = {},
): ProductEntity => ({
  id: PRODUCT_ID,
  categoryId: CATEGORY_ID,
  code: null,
  barcode: null,
  name: 'Almendras',
  description: null,
  saleUnit: SaleUnit.WEIGHT,
  imageUrls: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const emptyPage = <T>(): PaginatedResult<T> => ({
  items: [],
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 1,
});

class FakeBranchProductsRepository implements IBranchProductsRepository {
  public adminPage: PaginatedResult<BranchProductAdminRow> = emptyPage();
  public catalogPage: PaginatedResult<BranchCatalogRow> = emptyPage();
  public publishedCategories: BranchCatalogCategory[] = [
    { id: CATEGORY_ID, name: 'Frutos secos', slug: 'frutos-secos' },
  ];
  public existingBranchProduct: BranchProductEntity | null = null;
  public counts: BranchProductCounts = {
    [BranchProductStatus.ACTIVE]: 0,
    [BranchProductStatus.INACTIVE]: 0,
    [BranchProductStatus.UNCONFIGURED]: 0,
    ON_SALE: 0,
  };
  public lastAdminQuery: BranchProductQueryDto | null = null;
  public lastCatalogQuery: BranchProductQueryDto | null = null;
  public lastUpsert: {
    branchId: string;
    productId: string;
    data: UpsertBranchProductData;
  } | null = null;
  public lastOfferUpdate: {
    branchProductId: string;
    data: { promotionalPrice: string | null; isOnSale: boolean };
    weightOffers: { weightGrams: number; promotionalPrice: string }[];
  } | null = null;

  async findAdminList(_branchId: string, query: BranchProductQueryDto) {
    this.lastAdminQuery = query;
    return this.adminPage;
  }

  async countByStatus(_branchId: string) {
    return this.counts;
  }

  async findByBranchAndProduct(_branchId: string, _productId: string) {
    return this.existingBranchProduct;
  }

  async upsert(
    branchId: string,
    productId: string,
    data: UpsertBranchProductData,
  ): Promise<BranchProductEntity> {
    this.lastUpsert = { branchId, productId, data };
    return {
      id: 'bp-1',
      branchId,
      productId,
      price: data.price,
      promotionalPrice: data.promotionalPrice,
      isOnSale: data.isOnSale,
      isAvailable: data.isAvailable,
      isFeatured: data.isFeatured ?? false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
  }

  async updateOffer(
    branchProductId: string,
    data: { promotionalPrice: string | null; isOnSale: boolean },
    weightOffers: { weightGrams: number; promotionalPrice: string }[],
  ): Promise<BranchProductEntity> {
    this.lastOfferUpdate = { branchProductId, data, weightOffers };
    const current = this.existingBranchProduct!;
    const updated = {
      ...current,
      promotionalPrice: data.promotionalPrice,
      isOnSale: data.isOnSale,
      updatedAt: new Date('2026-01-03T00:00:00.000Z'),
    };
    this.existingBranchProduct = updated;
    return updated;
  }

  async findPublished(_branchId: string, query: BranchProductQueryDto) {
    this.lastCatalogQuery = query;
    return this.catalogPage;
  }

  async findPublishedCategories(_branchId: string) {
    return this.publishedCategories;
  }
}

describe('BranchProductsService', () => {
  let service: BranchProductsService;
  let repo: FakeBranchProductsRepository;
  let branches: BranchEntity[];
  let products: ProductEntity[];
  let publicCombos: BranchComboCatalogItem[];

  beforeEach(() => {
    repo = new FakeBranchProductsRepository();
    branches = [makeBranch()];
    products = [makeProduct()];
    publicCombos = [];

    const branchesRepo = {
      findById: async (id: string) => branches.find((b) => b.id === id) ?? null,
      findBySlug: async (slug: string) =>
        branches.find((b) => b.slug === slug) ?? null,
    } as unknown as IBranchesRepository;

    const productsRepo = {
      findById: async (id: string) => products.find((p) => p.id === id) ?? null,
    } as unknown as IProductsRepository;

    const combosService = {
      listPublicForBranch: async (_slug: string) => publicCombos,
    } as unknown as CombosService;

    service = new BranchProductsService(
      repo,
      branchesRepo,
      productsRepo,
      combosService,
    );
  });

  describe('listForBranch', () => {
    it('throws NotFound when the branch does not exist', async () => {
      await expect(service.listForBranch('missing', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('derives status and converts numeric strings to numbers', async () => {
      const base = {
        description: null,
        categoryId: CATEGORY_ID,
        categoryName: 'Frutos secos',
        saleUnit: SaleUnit.WEIGHT,
        barcode: null,
        imageUrls: [],
      };
      repo.adminPage = {
        ...emptyPage(),
        items: [
          {
            ...base,
            productId: 'p-active',
            name: 'A',
            branchProductId: 'bp-1',
            price: '5000.00',
            promotionalPrice: null,
            isOnSale: false,
            isAvailable: true,
          },
          {
            ...base,
            productId: 'p-hidden',
            name: 'B',
            branchProductId: 'bp-2',
            price: '2800.50',
            promotionalPrice: null,
            isOnSale: false,
            isAvailable: false,
          },
          {
            ...base,
            productId: 'p-new',
            name: 'C',
            branchProductId: null,
            price: null,
            promotionalPrice: null,
            isOnSale: null,
            isAvailable: null,
          },
        ],
        total: 3,
      };

      const result = await service.listForBranch(BRANCH_ID, {});

      expect(result.items.map((i) => i.status)).toEqual([
        BranchProductStatus.ACTIVE,
        BranchProductStatus.INACTIVE,
        BranchProductStatus.UNCONFIGURED,
      ]);
      expect(result.items[0]!.price).toBe(5000);
      expect(result.items[1]!.price).toBe(2800.5);
      expect(result.items[2]!.price).toBeNull();
      expect(result.items[2]!.isAvailable).toBe(false);
      expect(result.items[2]!.isOnSale).toBe(false);
      expect(result.total).toBe(3);
    });

    it('forwards the query (including isOnSale) to the repository', async () => {
      const query: BranchProductQueryDto = {
        status: BranchProductStatus.ACTIVE,
        isOnSale: true,
        search: 'x',
      };
      await service.listForBranch(BRANCH_ID, query);
      expect(repo.lastAdminQuery).toEqual(query);
    });
  });

  describe('countByStatus', () => {
    it('throws NotFound when the branch does not exist', async () => {
      await expect(service.countByStatus('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns counts per status including ON_SALE', async () => {
      repo.counts = {
        [BranchProductStatus.ACTIVE]: 4,
        [BranchProductStatus.INACTIVE]: 2,
        [BranchProductStatus.UNCONFIGURED]: 7,
        ON_SALE: 2,
      };
      expect(await service.countByStatus(BRANCH_ID)).toEqual(repo.counts);
    });
  });

  describe('upsert', () => {
    it('throws NotFound when the branch does not exist', async () => {
      await expect(
        service.upsert('missing', PRODUCT_ID, {
          price: 100,
          isAvailable: true,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when the branch is inactive', async () => {
      branches = [makeBranch({ isActive: false })];
      await expect(
        service.upsert(BRANCH_ID, PRODUCT_ID, {
          price: 100,
          isAvailable: true,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound when the master product does not exist', async () => {
      await expect(
        service.upsert(BRANCH_ID, 'missing', { price: 100, isAvailable: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects configuring a deactivated master product', async () => {
      products = [makeProduct({ isActive: false })];
      await expect(
        service.upsert(BRANCH_ID, PRODUCT_ID, {
          price: 100,
          isAvailable: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists price as a 2-decimal string and returns numbers + ISO dates', async () => {
      const result = await service.upsert(BRANCH_ID, PRODUCT_ID, {
        price: 5000,
        isAvailable: true,
      });

      expect(repo.lastUpsert).toEqual({
        branchId: BRANCH_ID,
        productId: PRODUCT_ID,
        data: {
          price: '5000.00',
          promotionalPrice: null,
          isOnSale: false,
          isAvailable: true,
        },
      });
      expect(result.price).toBe(5000);
      expect(result.isAvailable).toBe(true);
      expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });

    it('stores the promotional price only when the product is on sale', async () => {
      await service.upsert(BRANCH_ID, PRODUCT_ID, {
        price: 5000,
        promotionalPrice: 4500,
        isOnSale: true,
        isAvailable: true,
      });
      expect(repo.lastUpsert!.data.promotionalPrice).toBe('4500.00');
      expect(repo.lastUpsert!.data.isOnSale).toBe(true);

      await service.upsert(BRANCH_ID, PRODUCT_ID, {
        price: 5000,
        promotionalPrice: 4500,
        isOnSale: false,
        isAvailable: true,
      });
      expect(repo.lastUpsert!.data.promotionalPrice).toBeNull();
      expect(repo.lastUpsert!.data.isOnSale).toBe(false);
    });
  });

  describe('updateOffer', () => {
    it('throws BadRequestException if product is not configured in the branch yet', async () => {
      repo.existingBranchProduct = null;
      await expect(
        service.updateOffer(BRANCH_ID, PRODUCT_ID, {
          isOnSale: true,
          promotionalPrice: 4000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException if promotionalPrice >= current regular price', async () => {
      repo.existingBranchProduct = {
        id: 'bp-1',
        branchId: BRANCH_ID,
        productId: PRODUCT_ID,
        price: '5000.00',
        promotionalPrice: null,
        isOnSale: false,
        isAvailable: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(
        service.updateOffer(BRANCH_ID, PRODUCT_ID, {
          isOnSale: true,
          promotionalPrice: 5000,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('activates and deactivates an offer preserving regular price and availability', async () => {
      repo.existingBranchProduct = {
        id: 'bp-1',
        branchId: BRANCH_ID,
        productId: PRODUCT_ID,
        price: '5000.00',
        promotionalPrice: null,
        isOnSale: false,
        isAvailable: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const activated = await service.updateOffer(BRANCH_ID, PRODUCT_ID, {
        isOnSale: true,
        promotionalPrice: 4200,
      });
      expect(activated.isOnSale).toBe(true);
      expect(activated.promotionalPrice).toBe(4200);
      expect(activated.price).toBe(5000);

      const deactivated = await service.updateOffer(BRANCH_ID, PRODUCT_ID, {
        isOnSale: false,
      });
      expect(deactivated.isOnSale).toBe(false);
      expect(deactivated.promotionalPrice).toBeNull();
    });

    it('activates an exact offer only for the selected configured weight', async () => {
      repo.existingBranchProduct = {
        id: 'bp-1',
        branchId: BRANCH_ID,
        productId: PRODUCT_ID,
        price: '1000.00',
        promotionalPrice: null,
        isOnSale: false,
        isAvailable: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const activated = await service.updateOffer(BRANCH_ID, PRODUCT_ID, {
        isOnSale: true,
        promotionalPrice: null,
        weightOffers: [{ weightGrams: 250, promotionalPrice: 125 }],
      } as never);

      expect(repo.lastOfferUpdate).toEqual({
        branchProductId: 'bp-1',
        data: { promotionalPrice: null, isOnSale: true },
        weightOffers: [{ weightGrams: 250, promotionalPrice: '125.00' }],
      });
      expect(activated.isOnSale).toBe(true);
      expect(activated.promotionalPrice).toBeNull();
    });

    it('rejects weight offers outside the product options or above their regular portion price', async () => {
      repo.existingBranchProduct = {
        id: 'bp-1',
        branchId: BRANCH_ID,
        productId: PRODUCT_ID,
        price: '1000.00',
        promotionalPrice: null,
        isOnSale: false,
        isAvailable: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(
        service.updateOffer(BRANCH_ID, PRODUCT_ID, {
          isOnSale: true,
          promotionalPrice: null,
          weightOffers: [{ weightGrams: 75, promotionalPrice: 50 }],
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        service.updateOffer(BRANCH_ID, PRODUCT_ID, {
          isOnSale: true,
          promotionalPrice: null,
          weightOffers: [{ weightGrams: 250, promotionalPrice: 250 }],
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getPublicCatalog & getPublicOffers', () => {
    it('throws NotFound for an unknown slug', async () => {
      await expect(service.getPublicCatalog('nope', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFound for an inactive branch', async () => {
      branches = [makeBranch({ isActive: false })];
      await expect(
        service.getPublicCatalog('centro', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns branch metadata, active categories, and mapped items with numeric prices', async () => {
      const base = {
        description: null,
        categoryId: CATEGORY_ID,
        categoryName: 'Frutos secos',
        imageUrls: [],
        isOnSale: false,
        isFeatured: false,
        promotionalPrice: null,
      };
      repo.catalogPage = {
        ...emptyPage(),
        items: [
          {
            ...base,
            id: 'w',
            name: 'Almendras',
            saleUnit: SaleUnit.WEIGHT,
            price: '5000.00',
            weightOptionsGrams: [25, 50, 75, 100],
            defaultWeightGrams: 25,
            priceReferenceGrams: 100,
          },
          {
            ...base,
            id: 'u',
            name: 'Barra',
            saleUnit: SaleUnit.UNIT,
            price: '800.00',
            isOnSale: true,
            promotionalPrice: '700.00',
          },
        ],
        total: 2,
      };

      const result = await service.getPublicCatalog('centro', {});

      expect(result.branch).toEqual({
        id: BRANCH_ID,
        name: 'Centro',
        slug: 'centro',
        address: 'Av. Principal 123',
        phone: '11-1234-5678',
        whatsappNumber: '5491112345678',
      });
      expect(result.categories).toEqual([
        { id: CATEGORY_ID, name: 'Frutos secos', slug: 'frutos-secos' },
      ]);
      expect(result.items[0]).toMatchObject({
        price: 5000,
        priceUnitLabel: 'kg',
      });
      expect(result.items[0]).toMatchObject({
        weightOptionsGrams: [25, 50, 75, 100],
        defaultWeightGrams: 25,
        priceReferenceGrams: 100,
      });
      expect(result.items[1]).toMatchObject({
        price: 800,
        promotionalPrice: 700,
        isOnSale: true,
        priceUnitLabel: 'unidad',
      });
    });

    it('returns active offers (on-sale products and combos) for a branch slug', async () => {
      repo.catalogPage = {
        ...emptyPage(),
        items: [
          {
            id: PRODUCT_ID,
            name: 'Almendras',
            description: null,
            categoryId: CATEGORY_ID,
            categoryName: 'Frutos secos',
            saleUnit: SaleUnit.WEIGHT,
            price: '5000.00',
            promotionalPrice: '4200.00',
            isOnSale: true,
            isFeatured: false,
            imageUrls: [],
          },
        ],
        total: 1,
      };
      publicCombos = [
        {
          id: 'combo-1',
          name: 'Mix Energía',
          description: null,
          price: 9500,
          priceUnitLabel: 'combo',
          imageUrls: [],
          items: [],
        },
      ];

      const offers = await service.getPublicOffers('centro');

      expect(repo.lastCatalogQuery).toEqual({ isOnSale: true, limit: 200 });
      expect(offers.branch.slug).toBe('centro');
      expect(offers.products).toHaveLength(1);
      expect(offers.products[0]!.promotionalPrice).toBe(4200);
      expect(offers.combos).toHaveLength(1);
      expect(offers.combos[0]!.name).toBe('Mix Energía');
    });

    it('maps isFeatured correctly in public catalog', async () => {
      repo.catalogPage = {
        ...emptyPage(),
        items: [
          {
            id: PRODUCT_ID,
            name: 'Almendras Destacadas',
            description: null,
            categoryId: CATEGORY_ID,
            categoryName: 'Frutos secos',
            saleUnit: SaleUnit.WEIGHT,
            price: '5000.00',
            promotionalPrice: null,
            isOnSale: false,
            isFeatured: true,
            imageUrls: [],
          },
        ],
        total: 1,
      };

      const result = await service.getPublicCatalog('centro', {});
      expect(result.items[0]!.isFeatured).toBe(true);
    });
  });
});
