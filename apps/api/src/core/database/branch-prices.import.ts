import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { and, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { getRequiredSeedDatabaseUrl } from './branches.seed.js';
import { branchProducts } from './schema/branch-products.js';
import { branches } from './schema/branches.js';
import { products } from './schema/products.js';

const { Pool } = pg;

export const branchPriceImportHeaders = [
  'branch_slug',
  'code',
  'name',
  'original_price_ars',
  'reference_grams',
  'price_per_kg_ars',
  'source_line',
] as const;

const expectedBranchSlug = 'vergara';
const moneyPattern = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/u;

export interface BranchPriceImportRow {
  branchId: string;
  productId: string;
  price: string;
  promotionalPrice: null;
  isOnSale: false;
  isAvailable: false;
  isFeatured: false;
}

export interface BranchPriceImportStore {
  findBranchBySlug(slug: string): Promise<{ id: string; slug: string } | null>;
  findProductsByCodes(
    codes: readonly string[],
  ): Promise<Map<string, { id: string; code: string }>>;
  findExistingProductIds(
    branchId: string,
    productIds: readonly string[],
  ): Promise<Set<string>>;
  transaction<T>(
    operation: (transaction: BranchPriceImportTransaction) => Promise<T>,
  ): Promise<T>;
}

export interface BranchPriceImportTransaction {
  insertIfAbsent(row: BranchPriceImportRow): Promise<boolean>;
}

export interface BranchPriceImportResult {
  created: number;
  existing: number;
  rejected: number;
  errors: string[];
}

export interface BranchPriceImportOptions {
  dryRun?: boolean;
}

type ParsedBranchPrice = {
  branchSlug: string;
  code: string;
  originalPriceCents: bigint;
  referenceGrams: number;
  price: string;
  pricePerKgCents: bigint;
  sourceLine: number;
};

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  let quotedValueClosed = false;

  for (let index = 0; index < content.length; index++) {
    const character = content[index]!;
    if (character === '"') {
      if (quoted && content[index + 1] === '"') {
        value += '"';
        index++;
      } else if (quoted) {
        quoted = !quoted;
        quotedValueClosed = true;
      } else {
        if (value.length > 0 || quotedValueClosed) {
          throw new Error('CSV contains a quote outside a quoted field');
        }
        quoted = true;
      }
    } else if (character === ',' && !quoted) {
      row.push(value);
      value = '';
      quotedValueClosed = false;
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && content[index + 1] === '\n') index++;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
      quotedValueClosed = false;
    } else {
      if (quotedValueClosed) {
        throw new Error('CSV contains data after a closing quote');
      }
      value += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field');
  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

function parseMoney(
  value: string,
): { cents: bigint; normalized: string } | null {
  const match = moneyPattern.exec(value.trim());
  if (!match || match[1]!.length > 10) return null;
  const cents =
    BigInt(match[1]!) * 100n + BigInt((match[2] ?? '').padEnd(2, '0') || '0');
  if (cents <= 0n) return null;
  return {
    cents,
    normalized: `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`,
  };
}

function parseRows(csv: string): {
  rows: ParsedBranchPrice[];
  errors: string[];
} {
  let records: string[][];
  try {
    records = parseCsv(csv);
  } catch (error) {
    return {
      rows: [],
      errors: [
        `CSV parsing failed: ${error instanceof Error ? error.message : 'unknown parsing error'}`,
      ],
    };
  }
  if (records.length === 0) return { rows: [], errors: ['CSV is empty'] };
  if (records[0]!.join(',') !== branchPriceImportHeaders.join(',')) {
    return {
      rows: [],
      errors: [
        'CSV headers do not match the required branch price import format',
      ],
    };
  }

  const rows: ParsedBranchPrice[] = [];
  const errors: string[] = [];
  const codes = new Set<string>();
  for (const [offset, record] of records.slice(1).entries()) {
    const line = offset + 2;
    if (record.length !== branchPriceImportHeaders.length) {
      errors.push(
        `Line ${line}: expected ${branchPriceImportHeaders.length} columns`,
      );
      continue;
    }
    const [
      branchSlug,
      code,
      name,
      originalPrice,
      reference,
      pricePerKg,
      sourceLine,
    ] = record.map((value) => value.trim());
    if (branchSlug !== expectedBranchSlug) {
      errors.push(`Line ${line}: branch_slug must be ${expectedBranchSlug}`);
      continue;
    }
    if (!code || codes.has(code)) {
      errors.push(
        `Line ${line}: code must be present and unique within the CSV`,
      );
      continue;
    }
    codes.add(code);
    if (!name) {
      errors.push(`Line ${line}: name is required for traceability`);
      continue;
    }
    const parsedOriginalPrice = parseMoney(originalPrice);
    const parsedPricePerKg = parseMoney(pricePerKg);
    const parsedReference = Number(reference);
    const parsedSourceLine = Number(sourceLine);
    if (
      !parsedOriginalPrice ||
      !parsedPricePerKg ||
      !Number.isInteger(parsedReference) ||
      ![50, 100].includes(parsedReference)
    ) {
      errors.push(
        `Line ${line}: price and reference_grams must be valid positive monetary values with a 50 g or 100 g reference`,
      );
      continue;
    }
    if (!Number.isInteger(parsedSourceLine) || parsedSourceLine <= 0) {
      errors.push(`Line ${line}: source_line must be a positive integer`);
      continue;
    }
    if (
      parsedPricePerKg.cents * BigInt(parsedReference) !==
      parsedOriginalPrice.cents * 1000n
    ) {
      errors.push(
        `Line ${line}: price_per_kg_ars does not match original_price_ars and reference_grams`,
      );
      continue;
    }
    rows.push({
      branchSlug,
      code,
      originalPriceCents: parsedOriginalPrice.cents,
      referenceGrams: parsedReference,
      price: parsedPricePerKg.normalized,
      pricePerKgCents: parsedPricePerKg.cents,
      sourceLine: parsedSourceLine,
    });
  }
  return { rows, errors };
}

export async function runBranchPriceImport(
  store: BranchPriceImportStore,
  csv: string,
  options: BranchPriceImportOptions = {},
): Promise<BranchPriceImportResult> {
  const parsed = parseRows(csv);
  if (parsed.errors.length > 0)
    return {
      created: 0,
      existing: 0,
      rejected: parsed.errors.length,
      errors: parsed.errors,
    };

  const branch = await store.findBranchBySlug(expectedBranchSlug);
  if (!branch) {
    return {
      created: 0,
      existing: 0,
      rejected: parsed.rows.length,
      errors: [`Branch not found: ${expectedBranchSlug}`],
    };
  }
  const productsByCode = await store.findProductsByCodes(
    parsed.rows.map((row) => row.code),
  );
  const missingProductErrors = parsed.rows
    .filter((row) => !productsByCode.has(row.code))
    .map(
      (row) =>
        `Source line ${row.sourceLine}: product code not found: ${row.code}`,
    );
  if (missingProductErrors.length > 0) {
    return {
      created: 0,
      existing: 0,
      rejected: missingProductErrors.length,
      errors: missingProductErrors,
    };
  }

  const rows: BranchPriceImportRow[] = parsed.rows.map((row) => ({
    branchId: branch.id,
    productId: productsByCode.get(row.code)!.id,
    price: row.price,
    promotionalPrice: null,
    isOnSale: false,
    isAvailable: false,
    isFeatured: false,
  }));
  if (options.dryRun) {
    const existingProductIds = await store.findExistingProductIds(
      branch.id,
      rows.map((row) => row.productId),
    );
    return {
      created: rows.length - existingProductIds.size,
      existing: existingProductIds.size,
      rejected: 0,
      errors: [],
    };
  }

  return store.transaction(async (transaction) => {
    let created = 0;
    let existing = 0;
    for (const row of rows) {
      if (await transaction.insertIfAbsent(row)) created++;
      else existing++;
    }
    return { created, existing, rejected: 0, errors: [] };
  });
}

function createPostgresStore(
  db: ReturnType<typeof drizzle>,
): BranchPriceImportStore {
  return {
    async findBranchBySlug(slug) {
      const [branch] = await db
        .select({ id: branches.id, slug: branches.slug })
        .from(branches)
        .where(eq(branches.slug, slug));
      return branch ?? null;
    },
    async findProductsByCodes(codes) {
      const result = await db
        .select({ id: products.id, code: products.code })
        .from(products)
        .where(inArray(products.code, [...codes]));
      return new Map(
        result
          .filter(
            (product): product is { id: string; code: string } =>
              product.code !== null,
          )
          .map((product) => [product.code, product]),
      );
    },
    async findExistingProductIds(branchId, productIds) {
      if (productIds.length === 0) return new Set<string>();
      const result = await db
        .select({ productId: branchProducts.productId })
        .from(branchProducts)
        .where(
          and(
            eq(branchProducts.branchId, branchId),
            inArray(branchProducts.productId, [...productIds]),
          ),
        );
      return new Set(result.map((row) => row.productId));
    },
    transaction: (operation) =>
      db.transaction((transaction) =>
        operation({
          async insertIfAbsent(row) {
            const inserted = await transaction
              .insert(branchProducts)
              .values(row)
              .onConflictDoNothing({
                target: [branchProducts.branchId, branchProducts.productId],
              })
              .returning({ id: branchProducts.id });
            return inserted.length === 1;
          },
        }),
      ),
  };
}

function parseCommandArguments(args: readonly string[]): { dryRun: boolean } {
  const dryRun = args.includes('--dry-run');
  if (args.some((argument) => argument !== '--dry-run'))
    throw new Error('Unsupported argument; only --dry-run is allowed');
  return { dryRun };
}

export async function runBranchPriceImportCommand(
  args = process.argv.slice(2),
  csvPath = process.env.BRANCH_PRICES_CSV_PATH,
): Promise<BranchPriceImportResult> {
  if (!csvPath)
    throw new Error(
      'BRANCH_PRICES_CSV_PATH must be explicitly configured to import branch prices',
    );
  const { dryRun } = parseCommandArguments(args);
  const csv = await fs.readFile(csvPath, 'utf8');
  const pool = new Pool({
    connectionString: getRequiredSeedDatabaseUrl(process.env.DATABASE_URL),
  });
  try {
    const result = await runBranchPriceImport(
      createPostgresStore(drizzle(pool)),
      csv,
      { dryRun },
    );
    console.log(
      `Branch price import${dryRun ? ' dry-run' : ''} completed: created=${result.created}, existing=${result.existing}, rejected=${result.rejected}`,
    );
    return result;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBranchPriceImportCommand().catch((error: unknown) => {
    console.error(
      'Branch price import failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exitCode = 1;
  });
}
