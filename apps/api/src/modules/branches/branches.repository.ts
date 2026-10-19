import { Injectable, Inject } from '@nestjs/common';
import { eq, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../../core/database/database.constants.js';
import * as schema from '../../core/database/schema/index.js';
import type { BranchEntity, NewBranchEntity } from '../../core/database/schema/branches.js';
import type { IBranchesRepository } from './branches.repository.interface.js';

@Injectable()
export class BranchesRepository implements IBranchesRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAllActive(): Promise<BranchEntity[]> {
    return this.db
      .select()
      .from(schema.branches)
      .where(eq(schema.branches.isActive, true))
      .orderBy(asc(schema.branches.name));
  }

  async findAll(): Promise<BranchEntity[]> {
    return this.db
      .select()
      .from(schema.branches)
      .orderBy(asc(schema.branches.name));
  }

  async findById(id: string): Promise<BranchEntity | null> {
    const result = await this.db
      .select()
      .from(schema.branches)
      .where(eq(schema.branches.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async findBySlug(slug: string): Promise<BranchEntity | null> {
    const result = await this.db
      .select()
      .from(schema.branches)
      .where(eq(schema.branches.slug, slug.toLowerCase().trim()))
      .limit(1);

    return result[0] ?? null;
  }

  async create(data: NewBranchEntity): Promise<BranchEntity> {
    const result = await this.db
      .insert(schema.branches)
      .values({
        ...data,
        slug: data.slug.toLowerCase().trim(),
      })
      .returning();

    return result[0]!;
  }

  async update(id: string, data: Partial<NewBranchEntity>): Promise<BranchEntity | null> {
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.slug) {
      updateData.slug = data.slug.toLowerCase().trim();
    }

    const result = await this.db
      .update(schema.branches)
      .set(updateData)
      .where(eq(schema.branches.id, id))
      .returning();

    return result[0] ?? null;
  }
}
