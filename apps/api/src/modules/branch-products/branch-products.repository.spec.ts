import { describe, expect, it, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { branchCatalogCategorySchema } from '@nutrigon/contracts';
import * as schema from '../../core/database/schema/index.js';
import { BranchProductsRepository } from './branch-products.repository.js';

describe('published category counts', () => {
  it('accepts nonnegative category totals while preserving legacy categories', () => {
    const category = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Frutos secos',
      slug: 'frutos-secos',
    };
    expect(branchCatalogCategorySchema.safeParse(category).success).toBe(true);
    expect(
      branchCatalogCategorySchema.safeParse({
        ...category,
        count: 40,
        offersCount: 2,
      }).success,
    ).toBe(true);
    expect(
      branchCatalogCategorySchema.safeParse({ ...category, count: -1 }).success,
    ).toBe(false);
  });

  it('aggregates published products per category in the requested branch without pagination', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [['category-1', 'Frutos secos', 'frutos-secos', '40', '2']],
    });
    const db = drizzle({ client: { query } as never, schema });
    const repository = new BranchProductsRepository(db);

    const result = await repository.findPublishedCategories('branch-1');

    expect(result).toEqual([
      {
        id: 'category-1',
        name: 'Frutos secos',
        slug: 'frutos-secos',
        count: 40,
        offersCount: 2,
      },
    ]);
    expect(query).toHaveBeenCalledTimes(1);
    const [statement, params] = query.mock.calls[0]!;
    expect(statement.text).toContain('group by');
    expect(statement.text).toContain('count(*)');
    expect(statement.text).toContain('"branch_products"."branch_id" = $1');
    expect(statement.text).toContain('"branch_products"."is_available" = $2');
    expect(statement.text).toContain('"products"."is_active" = $3');
    expect(statement.text).toContain('"categories"."is_active" = $4');
    expect(statement.text).not.toMatch(/\blimit\b|\boffset\b|\bilike\b/i);
    expect(params).toEqual(['branch-1', true, true, true]);
  });
});
