import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_CLIENT } from '../../core/database/database.constants.js';
import * as schema from '../../core/database/schema/index.js';
import type {
  ICombosRepository,
  BranchComboRecord,
  ComboItemRow,
  CreateBranchComboData,
  UpdateBranchComboData,
} from './combos.repository.interface.js';

@Injectable()
export class CombosRepository implements ICombosRepository {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private async attachItems(
    rows: Array<{
      id: string;
      branchId: string;
      name: string;
      description: string | null;
      imageUrls: string[];
      price: string;
      isAvailable: boolean;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ): Promise<BranchComboRecord[]> {
    if (rows.length === 0) return [];

    const comboIds = rows.map((r) => r.id);
    const itemRows = await this.db
      .select({
        comboId: schema.comboItems.comboId,
        productId: schema.comboItems.productId,
        productName: schema.products.name,
        quantity: schema.comboItems.quantity,
        saleUnit: schema.products.saleUnit,
      })
      .from(schema.comboItems)
      .innerJoin(
        schema.products,
        eq(schema.comboItems.productId, schema.products.id),
      )
      .where(inArray(schema.comboItems.comboId, comboIds))
      .orderBy(asc(schema.products.name));

    const itemsByCombo = new Map<string, ComboItemRow[]>();
    for (const item of itemRows) {
      const list = itemsByCombo.get(item.comboId) ?? [];
      list.push({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        saleUnit: item.saleUnit,
      });
      itemsByCombo.set(item.comboId, list);
    }

    return rows.map((row) => ({
      ...row,
      items: itemsByCombo.get(row.id) ?? [],
    }));
  }

  async findByBranch(branchId: string): Promise<BranchComboRecord[]> {
    const rows = await this.db
      .select({
        id: schema.combos.id,
        branchId: schema.branchCombos.branchId,
        name: schema.combos.name,
        description: schema.combos.description,
        imageUrls: schema.combos.imageUrls,
        price: schema.branchCombos.price,
        isAvailable: schema.branchCombos.isAvailable,
        isActive: schema.combos.isActive,
        createdAt: schema.combos.createdAt,
        updatedAt: schema.combos.updatedAt,
      })
      .from(schema.branchCombos)
      .innerJoin(schema.combos, eq(schema.branchCombos.comboId, schema.combos.id))
      .where(
        and(
          eq(schema.branchCombos.branchId, branchId),
          eq(schema.combos.isActive, true),
        ),
      )
      .orderBy(asc(schema.combos.name));

    return this.attachItems(rows);
  }

  async findPublishedByBranch(branchId: string): Promise<BranchComboRecord[]> {
    const rows = await this.db
      .select({
        id: schema.combos.id,
        branchId: schema.branchCombos.branchId,
        name: schema.combos.name,
        description: schema.combos.description,
        imageUrls: schema.combos.imageUrls,
        price: schema.branchCombos.price,
        isAvailable: schema.branchCombos.isAvailable,
        isActive: schema.combos.isActive,
        createdAt: schema.combos.createdAt,
        updatedAt: schema.combos.updatedAt,
      })
      .from(schema.branchCombos)
      .innerJoin(schema.combos, eq(schema.branchCombos.comboId, schema.combos.id))
      .where(
        and(
          eq(schema.branchCombos.branchId, branchId),
          eq(schema.branchCombos.isAvailable, true),
          eq(schema.combos.isActive, true),
        ),
      )
      .orderBy(asc(schema.combos.name));

    return this.attachItems(rows);
  }

  async findByIdAndBranch(
    comboId: string,
    branchId: string,
  ): Promise<BranchComboRecord | null> {
    const rows = await this.db
      .select({
        id: schema.combos.id,
        branchId: schema.branchCombos.branchId,
        name: schema.combos.name,
        description: schema.combos.description,
        imageUrls: schema.combos.imageUrls,
        price: schema.branchCombos.price,
        isAvailable: schema.branchCombos.isAvailable,
        isActive: schema.combos.isActive,
        createdAt: schema.combos.createdAt,
        updatedAt: schema.combos.updatedAt,
      })
      .from(schema.branchCombos)
      .innerJoin(schema.combos, eq(schema.branchCombos.comboId, schema.combos.id))
      .where(
        and(
          eq(schema.combos.id, comboId),
          eq(schema.branchCombos.branchId, branchId),
          eq(schema.combos.isActive, true),
        ),
      )
      .limit(1);

    const attached = await this.attachItems(rows);
    return attached[0] ?? null;
  }

  async create(data: CreateBranchComboData): Promise<BranchComboRecord> {
    const comboId = await this.db.transaction(async (tx) => {
      const insertedCombos = await tx
        .insert(schema.combos)
        .values({
          name: data.name,
          description: data.description,
          imageUrls: data.imageUrls,
          isActive: true,
        })
        .returning();

      const combo = insertedCombos[0]!;

      await tx.insert(schema.comboItems).values(
        data.items.map((item) => ({
          comboId: combo.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      );

      await tx.insert(schema.branchCombos).values({
        branchId: data.branchId,
        comboId: combo.id,
        price: data.price,
        isAvailable: data.isAvailable,
      });

      return combo.id;
    });

    const created = await this.findByIdAndBranch(comboId, data.branchId);
    return created!;
  }

  async update(
    comboId: string,
    branchId: string,
    data: UpdateBranchComboData,
  ): Promise<BranchComboRecord | null> {
    const existing = await this.findByIdAndBranch(comboId, branchId);
    if (!existing) return null;

    await this.db.transaction(async (tx) => {
      const comboUpdate: Record<string, unknown> = {
        updatedAt: new Date(),
      };
      if (data.name !== undefined) comboUpdate.name = data.name;
      if (data.description !== undefined) comboUpdate.description = data.description;
      if (data.imageUrls !== undefined) comboUpdate.imageUrls = data.imageUrls;

      await tx
        .update(schema.combos)
        .set(comboUpdate)
        .where(eq(schema.combos.id, comboId));

      if (data.price !== undefined || data.isAvailable !== undefined) {
        const branchComboUpdate: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        if (data.price !== undefined) branchComboUpdate.price = data.price;
        if (data.isAvailable !== undefined) {
          branchComboUpdate.isAvailable = data.isAvailable;
        }

        await tx
          .update(schema.branchCombos)
          .set(branchComboUpdate)
          .where(
            and(
              eq(schema.branchCombos.comboId, comboId),
              eq(schema.branchCombos.branchId, branchId),
            ),
          );
      }

      if (data.items) {
        await tx
          .delete(schema.comboItems)
          .where(eq(schema.comboItems.comboId, comboId));

        await tx.insert(schema.comboItems).values(
          data.items.map((item) => ({
            comboId,
            productId: item.productId,
            quantity: item.quantity,
          })),
        );
      }
    });

    return this.findByIdAndBranch(comboId, branchId);
  }

  async softDelete(
    comboId: string,
    branchId: string,
  ): Promise<BranchComboRecord | null> {
    const existing = await this.findByIdAndBranch(comboId, branchId);
    if (!existing) return null;

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.combos)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(schema.combos.id, comboId));

      await tx
        .update(schema.branchCombos)
        .set({
          isAvailable: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.branchCombos.comboId, comboId),
            eq(schema.branchCombos.branchId, branchId),
          ),
        );
    });

    return {
      ...existing,
      isActive: false,
      isAvailable: false,
      updatedAt: new Date(),
    };
  }
}
