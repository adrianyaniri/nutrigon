import { Injectable, Inject } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../../core/database/database.constants.js';
import * as schema from '../../core/database/schema/index.js';
import type { CategoryEntity, NewCategoryEntity } from '../../core/database/schema/categories.js';
import type { ICategoriesRepository } from './categories.repository.interface.js';

@Injectable()
export class CategoriesRepository implements ICategoriesRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAllActive(): Promise<CategoryEntity[]> {
    return this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.isActive, true))
      .orderBy(asc(schema.categories.orderIndex), asc(schema.categories.name));
  }

  async findAll(): Promise<CategoryEntity[]> {
    return this.db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.orderIndex), asc(schema.categories.name));
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    const result = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const result = await this.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, slug.toLowerCase().trim()))
      .limit(1);

    return result[0] ?? null;
  }

  async create(data: NewCategoryEntity): Promise<CategoryEntity> {
    const result = await this.db
      .insert(schema.categories)
      .values({
        ...data,
        slug: data.slug.toLowerCase().trim(),
      })
      .returning();

    return result[0]!;
  }

  async update(id: string, data: Partial<NewCategoryEntity>): Promise<CategoryEntity | null> {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.slug) {
      updateData.slug = data.slug.toLowerCase().trim();
    }

    const result = await this.db
      .update(schema.categories)
      .set(updateData)
      .where(eq(schema.categories.id, id))
      .returning();

    return result[0] ?? null;
  }
}
