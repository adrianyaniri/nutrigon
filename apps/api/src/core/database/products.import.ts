import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { SaleUnit, createProductSchema } from '@nutrigon/contracts';
import { getRequiredSeedDatabaseUrl } from './branches.seed.js';
import { categories } from './schema/categories.js';
import { products } from './schema/products.js';

const { Pool } = pg;

export const productImportHeaders = [
  'code',
  'name',
  'category_slug',
  'sale_unit',
  'weight_options_grams',
  'default_weight_grams',
  'price_reference_grams',
  'is_active',
  'description',
] as const;

type ProductImportInput = {
  code: string;
  name: string;
  categorySlug: string;
  saleUnit: SaleUnit;
  weightOptionsGrams?: number[];
  defaultWeightGrams?: number;
  priceReferenceGrams?: 100 | 1000;
  isActive: boolean;
  description: string | null;
};

export type ProductImportRow = Omit<ProductImportInput, 'categorySlug'> & { categoryId: string };

export interface ProductImportTransaction {
  insertIfAbsent(product: ProductImportRow): Promise<boolean>;
}

export interface ProductImportStore {
  findCategoryIds(slugs: readonly string[]): Promise<Map<string, string>>;
  transaction<T>(operation: (transaction: ProductImportTransaction) => Promise<T>): Promise<T>;
}

export interface ProductImportResult {
  created: number;
  existing: number;
  rejected: number;
  errors: string[];
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < content.length; index++) {
    const character = content[index]!;
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        value += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && content[index + 1] === '\n') index++;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field');
  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function parseWeightOptions(value: string): number[] | undefined {
  if (!value.trim()) return undefined;
  return value.split(';').map((part) => Number(part.trim()));
}

function parseInteger(value: string): number | undefined {
  if (!value.trim()) return undefined;
  return Number(value.trim());
}

function parseBoolean(value: string): boolean | undefined {
  if (value.trim() === 'true') return true;
  if (value.trim() === 'false') return false;
  return undefined;
}

function parseImportInput(csv: string): { rows: ProductImportInput[]; errors: string[] } {
  const records = parseCsv(csv);
  if (records.length === 0) return { rows: [], errors: ['CSV is empty'] };
  if (records[0]!.join(',') !== productImportHeaders.join(',')) {
    return { rows: [], errors: ['CSV headers do not match the required import format'] };
  }

  const rows: ProductImportInput[] = [];
  const errors: string[] = [];
  const codes = new Set<string>();
  for (const [offset, record] of records.slice(1).entries()) {
    const line = offset + 2;
    if (record.length !== productImportHeaders.length) {
      errors.push(`Line ${line}: expected ${productImportHeaders.length} columns`);
      continue;
    }
    const [code, name, categorySlug, saleUnit, weightOptions, defaultWeight, reference, isActive, description] = record;
    const normalizedCode = code!.trim();
    if (!normalizedCode) {
      errors.push(`Line ${line}: code is required`);
      continue;
    }
    if (codes.has(normalizedCode)) {
      errors.push(`Line ${line}: duplicate code ${normalizedCode}`);
      continue;
    }
    codes.add(normalizedCode);
    const parsedActive = parseBoolean(isActive!);
    if (parsedActive === undefined) {
      errors.push(`Line ${line}: is_active must be true or false`);
      continue;
    }
    const candidate = {
      code: normalizedCode,
      name: name!.trim(),
      categoryId: '00000000-0000-4000-8000-000000000000',
      saleUnit: saleUnit!.trim(),
      weightOptionsGrams: parseWeightOptions(weightOptions!),
      defaultWeightGrams: parseInteger(defaultWeight!),
      priceReferenceGrams: parseInteger(reference!),
      description: description!.trim() || null,
      imageUrls: [],
    };
    const validated = createProductSchema.safeParse(candidate);
    if (!validated.success) {
      errors.push(`Line ${line}: invalid product configuration`);
      continue;
    }
    if (validated.data.saleUnit === SaleUnit.UNIT && (weightOptions!.trim() || defaultWeight!.trim() || reference!.trim())) {
      errors.push(`Line ${line}: UNIT products must leave weight fields empty`);
      continue;
    }
    if (validated.data.saleUnit === SaleUnit.WEIGHT && (!weightOptions!.trim() || !defaultWeight!.trim() || !reference!.trim())) {
      errors.push(`Line ${line}: WEIGHT products require all weight fields`);
      continue;
    }
    rows.push({
      code: validated.data.code!,
      name: validated.data.name,
      categorySlug: categorySlug!.trim(),
      saleUnit: validated.data.saleUnit,
      weightOptionsGrams: validated.data.weightOptionsGrams,
      defaultWeightGrams: validated.data.defaultWeightGrams,
      priceReferenceGrams: validated.data.priceReferenceGrams as 100 | 1000 | undefined,
      isActive: parsedActive,
      description: validated.data.description ?? null,
    });
  }
  return { rows, errors };
}

export async function runProductImport(store: ProductImportStore, csv: string): Promise<ProductImportResult> {
  const parsed = parseImportInput(csv);
  if (parsed.errors.length > 0) return { created: 0, existing: 0, rejected: parsed.errors.length, errors: parsed.errors };

  const categoryIds = await store.findCategoryIds([...new Set(parsed.rows.map((row) => row.categorySlug))]);
  const categoryErrors = parsed.rows
    .filter((row) => !categoryIds.has(row.categorySlug))
    .map((row) => `Unknown category slug: ${row.categorySlug}`);
  if (categoryErrors.length > 0) return { created: 0, existing: 0, rejected: categoryErrors.length, errors: categoryErrors };

  return store.transaction(async (transaction) => {
    let created = 0;
    let existing = 0;
    for (const row of parsed.rows) {
      const { categorySlug: _categorySlug, ...product } = row;
      if (await transaction.insertIfAbsent({ ...product, categoryId: categoryIds.get(row.categorySlug)! })) created++;
      else existing++;
    }
    return { created, existing, rejected: 0, errors: [] };
  });
}

function createPostgresStore(db: ReturnType<typeof drizzle>): ProductImportStore {
  return {
    async findCategoryIds(slugs) {
      const result = await db.select({ slug: categories.slug, id: categories.id }).from(categories).where(inArray(categories.slug, [...slugs]));
      return new Map(result.map((category) => [category.slug, category.id]));
    },
    transaction: (operation) => db.transaction((transaction) => operation({
      async insertIfAbsent(product) {
        const inserted = await transaction
          .insert(products)
          .values(product)
          .onConflictDoNothing({
            target: products.code,
            where: sql`${products.code} IS NOT NULL`,
          })
          .returning({ id: products.id });
        return inserted.length === 1;
      },
    })),
  };
}

export async function runProductImportCommand(path = process.env.PRODUCTS_CSV_PATH): Promise<ProductImportResult> {
  if (!path) throw new Error('PRODUCTS_CSV_PATH must be explicitly configured to import products');
  const csv = await fs.readFile(path, 'utf8');
  const pool = new Pool({ connectionString: getRequiredSeedDatabaseUrl(process.env.DATABASE_URL) });
  try {
    const result = await runProductImport(createPostgresStore(drizzle(pool)), csv);
    console.log(`Product import completed: created=${result.created}, existing=${result.existing}, rejected=${result.rejected}`);
    return result;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runProductImportCommand().catch((error: unknown) => {
    console.error('Product import failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  });
}
