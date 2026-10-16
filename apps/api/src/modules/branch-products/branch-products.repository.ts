import { Injectable, Inject } from '@nestjs/common';
import {
  eq,
  and,
  ilike,
  isNull,
  isNotNull,
  count,
  asc,
  desc,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  BranchProductStatus,
  type BranchCatalogCategory,
  type BranchProductCounts,
} from '@nutrigon/contracts';
import { DRIZZLE_CLIENT } from '../../core/database/database.constants.js';
import * as schema from '../../core/database/schema/index.js';
import type { BranchProductEntity } from '../../core/database/schema/branch-products.js';
import type { PaginatedResult } from '../products/products.repository.interface.js';
import type {
  IBranchProductsRepository,
  BranchProductAdminRow,
  BranchCatalogRow,
  UpsertBranchProductData,
} from './branch-products.repository.interface.js';
import type { BranchProductQueryDto } from './dto/branch-product.dto.js';

@Injectable()
export class BranchProductsRepository implements IBranchProductsRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAdminList(
    branchId: string,
    query: BranchProductQueryDto,
  ): Promise<PaginatedResult<BranchProductAdminRow>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [
      eq(schema.products.isActive, true),
      eq(schema.categories.isActive, true),
    ];

    if (query.search && query.search.trim()) {
      conditions.push(ilike(schema.products.name, `%${query.search.trim()}%`));
    }

    if (query.categoryId) {
      conditions.push(eq(schema.products.categoryId, query.categoryId));
    }

    if (query.categorySlug && query.categorySlug.trim()) {
      conditions.push(eq(schema.categories.slug, query.categorySlug.trim()));
    }

    if (query.barcode && query.barcode.trim()) {
      conditions.push(eq(schema.products.barcode, query.barcode.trim()));
    }

    if (typeof query.isOnSale === 'boolean') {
      if (query.isOnSale) {
        conditions.push(eq(schema.branchProducts.isOnSale, true));
      } else {
        conditions.push(
          sql`coalesce(${schema.branchProducts.isOnSale}, false) = false`,
        );
      }
    }

    if (query.status === BranchProductStatus.ACTIVE) {
      conditions.push(eq(schema.branchProducts.isAvailable, true));
    } else if (query.status === BranchProductStatus.INACTIVE) {
      conditions.push(isNotNull(schema.branchProducts.id));
      conditions.push(eq(schema.branchProducts.isAvailable, false));
    } else if (query.status === BranchProductStatus.UNCONFIGURED) {
      conditions.push(isNull(schema.branchProducts.id));
    }

    const whereClause = and(...conditions);

    const joinCondition = and(
      eq(schema.branchProducts.productId, schema.products.id),
      eq(schema.branchProducts.branchId, branchId),
    );

    const totalResult = await this.db
      .select({ total: count() })
      .from(schema.products)
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .leftJoin(schema.branchProducts, joinCondition)
      .where(whereClause);

    const total = Number(totalResult[0]?.total ?? 0);

    const items = await this.db
      .select({
        productId: schema.products.id,
        name: schema.products.name,
        description: schema.products.description,
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        saleUnit: schema.products.saleUnit,
        barcode: schema.products.barcode,
        imageUrls: schema.products.imageUrls,
        branchProductId: schema.branchProducts.id,
        price: schema.branchProducts.price,
        promotionalPrice: schema.branchProducts.promotionalPrice,
        isOnSale: schema.branchProducts.isOnSale,
        isAvailable: schema.branchProducts.isAvailable,
        isFeatured: schema.branchProducts.isFeatured,
      })
      .from(schema.products)
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .leftJoin(schema.branchProducts, joinCondition)
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

  async countByStatus(branchId: string): Promise<BranchProductCounts> {
    const joinCondition = and(
      eq(schema.branchProducts.productId, schema.products.id),
      eq(schema.branchProducts.branchId, branchId),
    );

    const rows = await this.db
      .select({
        active: sql<number>`count(*) filter (where ${schema.branchProducts.isAvailable} = true)`,
        inactive: sql<number>`count(*) filter (where ${schema.branchProducts.id} is not null and ${schema.branchProducts.isAvailable} = false)`,
        unconfigured: sql<number>`count(*) filter (where ${schema.branchProducts.id} is null)`,
        onSale: sql<number>`count(*) filter (where ${schema.branchProducts.isAvailable} = true and ${schema.branchProducts.isOnSale} = true)`,
      })
      .from(schema.products)
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .leftJoin(schema.branchProducts, joinCondition)
      .where(
        and(
          eq(schema.products.isActive, true),
          eq(schema.categories.isActive, true),
        ),
      );

    const row = rows[0];
    return {
      [BranchProductStatus.ACTIVE]: Number(row?.active ?? 0),
      [BranchProductStatus.INACTIVE]: Number(row?.inactive ?? 0),
      [BranchProductStatus.UNCONFIGURED]: Number(row?.unconfigured ?? 0),
      ON_SALE: Number(row?.onSale ?? 0),
    };
  }

  async findByBranchAndProduct(
    branchId: string,
    productId: string,
  ): Promise<BranchProductEntity | null> {
    const rows = await this.db
      .select()
      .from(schema.branchProducts)
      .where(
        and(
          eq(schema.branchProducts.branchId, branchId),
          eq(schema.branchProducts.productId, productId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async upsert(
    branchId: string,
    productId: string,
    data: UpsertBranchProductData,
  ): Promise<BranchProductEntity> {
    const result = await this.db
      .insert(schema.branchProducts)
      .values({
        branchId,
        productId,
        price: data.price,
        promotionalPrice: data.promotionalPrice,
        isOnSale: data.isOnSale,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured ?? false,
      })
      .onConflictDoUpdate({
        target: [schema.branchProducts.branchId, schema.branchProducts.productId],
        set: {
          price: data.price,
          promotionalPrice: data.promotionalPrice,
          isOnSale: data.isOnSale,
          isAvailable: data.isAvailable,
          ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0]!;
  }

  async findPublished(
    branchId: string,
    query: BranchProductQueryDto,
  ): Promise<PaginatedResult<BranchCatalogRow>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [
      eq(schema.branchProducts.branchId, branchId),
      eq(schema.branchProducts.isAvailable, true),
      eq(schema.products.isActive, true),
      eq(schema.categories.isActive, true),
    ];

    if (query.search && query.search.trim()) {
      conditions.push(ilike(schema.products.name, `%${query.search.trim()}%`));
    }

    if (query.categoryId) {
      conditions.push(eq(schema.products.categoryId, query.categoryId));
    }

    if (query.categorySlug && query.categorySlug.trim()) {
      conditions.push(eq(schema.categories.slug, query.categorySlug.trim()));
    }

    if (query.barcode && query.barcode.trim()) {
      conditions.push(eq(schema.products.barcode, query.barcode.trim()));
    }

    if (typeof query.isOnSale === 'boolean') {
      conditions.push(eq(schema.branchProducts.isOnSale, query.isOnSale));
    }

    if (typeof query.isFeatured === 'boolean') {
      conditions.push(eq(schema.branchProducts.isFeatured, query.isFeatured));
    }

    const whereClause = and(...conditions);

    const totalResult = await this.db
      .select({ total: count() })
      .from(schema.branchProducts)
      .innerJoin(
        schema.products,
        eq(schema.branchProducts.productId, schema.products.id),
      )
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .where(whereClause);

    const total = Number(totalResult[0]?.total ?? 0);

    const items = await this.db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        description: schema.products.description,
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        saleUnit: schema.products.saleUnit,
        price: schema.branchProducts.price,
        promotionalPrice: schema.branchProducts.promotionalPrice,
        isOnSale: schema.branchProducts.isOnSale,
        isFeatured: schema.branchProducts.isFeatured,
        imageUrls: schema.products.imageUrls,
      })
      .from(schema.branchProducts)
      .innerJoin(
        schema.products,
        eq(schema.branchProducts.productId, schema.products.id),
      )
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .where(whereClause)
      .orderBy(
        desc(schema.branchProducts.isFeatured),
        asc(schema.categories.orderIndex),
        asc(schema.products.name),
      )
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

  async findPublishedCategories(
    branchId: string,
  ): Promise<BranchCatalogCategory[]> {
    const rows = await this.db
      .selectDistinctOn([schema.categories.orderIndex, schema.categories.name], {
        id: schema.categories.id,
        name: schema.categories.name,
        slug: schema.categories.slug,
      })
      .from(schema.branchProducts)
      .innerJoin(
        schema.products,
        eq(schema.branchProducts.productId, schema.products.id),
      )
      .innerJoin(
        schema.categories,
        eq(schema.products.categoryId, schema.categories.id),
      )
      .where(
        and(
          eq(schema.branchProducts.branchId, branchId),
          eq(schema.branchProducts.isAvailable, true),
          eq(schema.products.isActive, true),
          eq(schema.categories.isActive, true),
        ),
      )
      .orderBy(asc(schema.categories.orderIndex), asc(schema.categories.name));

    return rows;
  }
}
