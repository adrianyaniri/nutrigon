import { Injectable, Inject } from '@nestjs/common';
import { eq, and, or, ilike, count, asc, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../../core/database/database.constants.js';
import * as schema from '../../core/database/schema/index.js';
import type { ProductEntity, NewProductEntity } from '../../core/database/schema/products.js';
import type {
  IProductsRepository,
  PaginatedResult,
} from './products.repository.interface.js';
import type { ProductQueryDto } from './dto/product.dto.js';

@Injectable()
export class ProductsRepository implements IProductsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findMany(query: ProductQueryDto): Promise<PaginatedResult<ProductEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.products.name, term),
          ilike(schema.products.code, term),
          ilike(schema.products.barcode, term),
        )!,
      );
    }

    if (query.categoryId) {
      conditions.push(eq(schema.products.categoryId, query.categoryId));
    }

    if (query.code && query.code.trim()) {
      conditions.push(eq(schema.products.code, query.code.trim()));
    }

    if (query.barcode && query.barcode.trim()) {
      conditions.push(eq(schema.products.barcode, query.barcode.trim()));
    }

    if (typeof query.isActive === 'boolean') {
      conditions.push(eq(schema.products.isActive, query.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await this.db
      .select({ total: count() })
      .from(schema.products)
      .where(whereClause);

    const total = Number(totalResult[0]?.total ?? 0);

    const items = await this.db
      .select()
      .from(schema.products)
      .where(whereClause)
      .orderBy(asc(schema.products.name))
      .limit(limit)
      .offset(offset);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const result = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findByCode(code: string): Promise<ProductEntity | null> {
    const result = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.code, code.trim()))
      .limit(1);

    return result[0] ?? null;
  }

  async create(data: NewProductEntity): Promise<ProductEntity> {
    const result = await this.db
      .insert(schema.products)
      .values({
        ...data,
        name: data.name.trim(),
        code: data.code?.trim() || null,
        barcode: data.barcode?.trim() || null,
      })
      .returning();

    return result[0]!;
  }

  async update(id: string, data: Partial<NewProductEntity>): Promise<ProductEntity | null> {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.name) updateData.name = data.name.trim();
    if (data.code !== undefined) updateData.code = data.code?.trim() || null;
    if (data.barcode !== undefined) updateData.barcode = data.barcode?.trim() || null;

    const result = await this.db
      .update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, id))
      .returning();

    return result[0] ?? null;
  }

  /**
   * Atomic Soft Delete:
   * Sets isActive = false in master products table AND
   * sets isAvailable = false in branch_products within an atomic database transaction.
   */
  async softDelete(id: string): Promise<ProductEntity | null> {
    return this.db.transaction(async (tx) => {
      const updatedProducts = await tx
        .update(schema.products)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, id))
        .returning();

      const product = updatedProducts[0];
      if (!product) {
        return null;
      }

      await tx
        .update(schema.branchProducts)
        .set({
          isAvailable: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.branchProducts.productId, id));

      return product;
    });
  }
}
