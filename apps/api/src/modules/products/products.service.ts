import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { ProductEntity } from '../../core/database/schema/products.js';
import {
  PRODUCTS_REPOSITORY,
  type IProductsRepository,
  type PaginatedResult,
} from './products.repository.interface.js';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../categories/categories.repository.interface.js';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,
  ) {}

  async findMany(query: ProductQueryDto): Promise<PaginatedResult<ProductEntity>> {
    return this.productsRepository.findMany(query);
  }

  async findById(id: string): Promise<ProductEntity> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" was not found`);
    }
    return product;
  }

  private async ensureActiveCategory(categoryId: string): Promise<void> {
    const category = await this.categoriesRepository.findById(categoryId);
    if (!category || !category.isActive) {
      throw new BadRequestException(`Category with ID "${categoryId}" is invalid or inactive`);
    }
  }

  private async ensureUniqueCode(code?: string | null, excludeProductId?: string): Promise<void> {
    const normalizedCode = code?.trim();
    if (!normalizedCode) {
      return;
    }

    const existing = await this.productsRepository.findByCode(normalizedCode);
    if (existing && existing.id !== excludeProductId) {
      throw new ConflictException(`Product with code "${normalizedCode}" already exists`);
    }
  }

  async create(dto: CreateProductDto): Promise<ProductEntity> {
    await this.ensureActiveCategory(dto.categoryId);
    await this.ensureUniqueCode(dto.code);

    return this.productsRepository.create({
      categoryId: dto.categoryId,
      name: dto.name,
      code: dto.code || null,
      barcode: dto.barcode || null,
      description: dto.description || null,
      saleUnit: dto.saleUnit,
      imageUrls: dto.imageUrls ?? [],
      isActive: true,
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const product = await this.findById(id);

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.ensureActiveCategory(dto.categoryId);
    }

    if (dto.code && dto.code.trim() !== product.code) {
      await this.ensureUniqueCode(dto.code, id);
    }

    const updated = await this.productsRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Product with ID "${id}" was not found`);
    }

    return updated;
  }

  async softDelete(id: string): Promise<ProductEntity> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" was not found`);
    }

    const updated = await this.productsRepository.softDelete(id);
    if (!updated) {
      throw new NotFoundException(`Product with ID "${id}" was not found`);
    }

    return updated;
  }
}
