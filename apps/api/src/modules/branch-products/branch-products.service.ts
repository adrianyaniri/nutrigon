import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  BranchProductStatus,
  SaleUnit,
  type BranchProduct,
  type BranchProductAdminItem,
  type BranchCatalogItem,
  type BranchProductCounts,
  type BranchPublicCatalogResponse,
  type BranchPublicOffersResponse,
} from '@nutrigon/contracts';
import {
  BRANCH_PRODUCTS_REPOSITORY,
  type IBranchProductsRepository,
} from './branch-products.repository.interface.js';
import {
  BRANCHES_REPOSITORY,
  type IBranchesRepository,
} from '../branches/branches.repository.interface.js';
import {
  PRODUCTS_REPOSITORY,
  type IProductsRepository,
  type PaginatedResult,
} from '../products/products.repository.interface.js';
import { CombosService } from '../combos/combos.service.js';
import type {
  UpsertBranchProductDto,
  UpdateBranchProductOfferDto,
  BranchProductQueryDto,
} from './dto/branch-product.dto.js';

@Injectable()
export class BranchProductsService {
  constructor(
    @Inject(BRANCH_PRODUCTS_REPOSITORY)
    private readonly branchProductsRepository: IBranchProductsRepository,
    @Inject(BRANCHES_REPOSITORY)
    private readonly branchesRepository: IBranchesRepository,
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
    @Optional()
    private readonly combosService?: CombosService,
  ) {}

  async listForBranch(
    branchId: string,
    query: BranchProductQueryDto,
  ): Promise<PaginatedResult<BranchProductAdminItem>> {
    const branch = await this.branchesRepository.findById(branchId);
    if (!branch) {
      throw new NotFoundException(`Branch with ID "${branchId}" was not found`);
    }

    const result = await this.branchProductsRepository.findAdminList(branchId, query);

    const items: BranchProductAdminItem[] = result.items.map((row) => {
      const status =
        row.branchProductId === null
          ? BranchProductStatus.UNCONFIGURED
          : row.isAvailable
            ? BranchProductStatus.ACTIVE
            : BranchProductStatus.INACTIVE;

      return {
        productId: row.productId,
        name: row.name,
        description: row.description,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        saleUnit: row.saleUnit as SaleUnit,
        barcode: row.barcode,
        imageUrls: row.imageUrls ?? [],
        status,
        price: row.price !== null ? Number(row.price) : null,
        promotionalPrice:
          row.promotionalPrice !== null ? Number(row.promotionalPrice) : null,
        isOnSale: row.isOnSale ?? false,
        isAvailable: row.isAvailable ?? false,
      };
    });

    return {
      ...result,
      items,
    };
  }

  async countByStatus(branchId: string): Promise<BranchProductCounts> {
    const branch = await this.branchesRepository.findById(branchId);
    if (!branch) {
      throw new NotFoundException(`Branch with ID "${branchId}" was not found`);
    }

    return this.branchProductsRepository.countByStatus(branchId);
  }

  async upsert(
    branchId: string,
    productId: string,
    dto: UpsertBranchProductDto,
  ): Promise<BranchProduct> {
    const branch = await this.branchesRepository.findById(branchId);
    if (!branch || !branch.isActive) {
      throw new NotFoundException(
        `Branch with ID "${branchId}" was not found or is inactive`,
      );
    }

    const product = await this.productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" was not found`);
    }

    if (!product.isActive) {
      throw new BadRequestException(
        `Product with ID "${productId}" is deactivated in the master catalog`,
      );
    }

    const isOnSale = Boolean(dto.isOnSale);
    const promotionalPrice =
      isOnSale && dto.promotionalPrice !== null && dto.promotionalPrice !== undefined
        ? dto.promotionalPrice.toFixed(2)
        : null;

    const entity = await this.branchProductsRepository.upsert(branchId, productId, {
      price: dto.price.toFixed(2),
      promotionalPrice,
      isOnSale,
      isAvailable: dto.isAvailable ?? false,
    });

    return {
      id: entity.id,
      branchId: entity.branchId,
      productId: entity.productId,
      price: Number(entity.price),
      promotionalPrice:
        entity.promotionalPrice !== null ? Number(entity.promotionalPrice) : null,
      isOnSale: entity.isOnSale,
      isAvailable: entity.isAvailable,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  async updateOffer(
    branchId: string,
    productId: string,
    dto: UpdateBranchProductOfferDto,
  ): Promise<BranchProduct> {
    const branch = await this.branchesRepository.findById(branchId);
    if (!branch || !branch.isActive) {
      throw new NotFoundException(
        `Branch with ID "${branchId}" was not found or is inactive`,
      );
    }

    const existing = await this.branchProductsRepository.findByBranchAndProduct(
      branchId,
      productId,
    );
    if (!existing) {
      throw new BadRequestException(
        `Product "${productId}" must have a configured regular price in branch "${branchId}" before setting an offer`,
      );
    }

    const regularPrice = Number(existing.price);
    if (dto.isOnSale) {
      if (
        dto.promotionalPrice === null ||
        dto.promotionalPrice === undefined ||
        dto.promotionalPrice <= 0 ||
        dto.promotionalPrice >= regularPrice
      ) {
        throw new BadRequestException(
          `Promotional price must be greater than 0 and strictly less than the regular price (${regularPrice})`,
        );
      }
    }

    const entity = await this.branchProductsRepository.upsert(branchId, productId, {
      price: existing.price,
      promotionalPrice:
        dto.isOnSale && dto.promotionalPrice ? dto.promotionalPrice.toFixed(2) : null,
      isOnSale: dto.isOnSale,
      isAvailable: existing.isAvailable,
    });

    return {
      id: entity.id,
      branchId: entity.branchId,
      productId: entity.productId,
      price: Number(entity.price),
      promotionalPrice:
        entity.promotionalPrice !== null ? Number(entity.promotionalPrice) : null,
      isOnSale: entity.isOnSale,
      isAvailable: entity.isAvailable,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  async getPublicCatalog(
    slug: string,
    query: BranchProductQueryDto,
  ): Promise<BranchPublicCatalogResponse> {
    const branch = await this.branchesRepository.findBySlug(slug);
    if (!branch || !branch.isActive) {
      throw new NotFoundException(`Branch "${slug}" was not found or is inactive`);
    }

    const { status: _ignoredStatus, ...sanitizedQuery } = query;
    const [result, categories] = await Promise.all([
      this.branchProductsRepository.findPublished(branch.id, sanitizedQuery),
      this.branchProductsRepository.findPublishedCategories(branch.id),
    ]);

    const items: BranchCatalogItem[] = result.items.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      saleUnit: row.saleUnit as SaleUnit,
      price: Number(row.price),
      promotionalPrice:
        row.promotionalPrice !== null ? Number(row.promotionalPrice) : null,
      isOnSale: row.isOnSale,
      priceUnitLabel: row.saleUnit === SaleUnit.WEIGHT ? 'kg' : 'unidad',
      imageUrls: row.imageUrls ?? [],
    }));

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        address: branch.address,
        phone: branch.phone,
        whatsappNumber: branch.whatsappNumber,
      },
      categories,
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getPublicOffers(slug: string): Promise<BranchPublicOffersResponse> {
    const branch = await this.branchesRepository.findBySlug(slug);
    if (!branch || !branch.isActive) {
      throw new NotFoundException(`Branch "${slug}" was not found or is inactive`);
    }

    const [onSaleProducts, combos] = await Promise.all([
      this.branchProductsRepository.findPublished(branch.id, {
        isOnSale: true,
        limit: 200,
      }),
      this.combosService
        ? this.combosService.listPublicForBranch(slug)
        : Promise.resolve([]),
    ]);

    const products: BranchCatalogItem[] = onSaleProducts.items.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      saleUnit: row.saleUnit as SaleUnit,
      price: Number(row.price),
      promotionalPrice:
        row.promotionalPrice !== null ? Number(row.promotionalPrice) : null,
      isOnSale: row.isOnSale,
      priceUnitLabel: row.saleUnit === SaleUnit.WEIGHT ? 'kg' : 'unidad',
      imageUrls: row.imageUrls ?? [],
    }));

    return {
      branch: {
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        address: branch.address,
        phone: branch.phone,
        whatsappNumber: branch.whatsappNumber,
      },
      products,
      combos,
    };
  }
}
