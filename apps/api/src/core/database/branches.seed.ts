import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { z } from 'zod';
import { createBranchSchema, type CreateBranchDto } from '@nutrigon/contracts';
import { drizzle } from 'drizzle-orm/node-postgres';
import { initialBranches } from './initial-branches.js';
import { branches } from './schema/branches.js';
import '../config/env.js';

const { Pool } = pg;

const databaseUrlSchema = z
  .string()
  .trim()
  .url('DATABASE_URL must be a complete PostgreSQL connection URL')
  .refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), {
    message: 'DATABASE_URL must use the postgres or postgresql protocol',
  });

export interface BranchSeedTransaction {
  insertIfAbsent(branch: CreateBranchDto): Promise<boolean>;
}

export interface BranchSeedStore {
  transaction<T>(operation: (transaction: BranchSeedTransaction) => Promise<T>): Promise<T>;
}

export interface BranchSeedResult {
  created: number;
  existing: number;
  rejected: number;
}

export function getRequiredSeedDatabaseUrl(value: string | undefined): string {
  if (!value) {
    throw new Error('DATABASE_URL must be explicitly configured to run the branches seed');
  }

  const parsed = databaseUrlSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error('DATABASE_URL must be a complete PostgreSQL connection URL');
  }

  return parsed.data;
}

export async function runBranchesSeed(
  store: BranchSeedStore,
  input: readonly unknown[],
): Promise<BranchSeedResult> {
  const validBranches: CreateBranchDto[] = [];
  let rejected = 0;

  for (const candidate of input) {
    const parsed = createBranchSchema.safeParse(candidate);
    if (!parsed.success) {
      rejected++;
      continue;
    }
    validBranches.push(parsed.data);
  }

  return store.transaction(async (transaction) => {
    let created = 0;
    let existing = 0;

    for (const branch of validBranches) {
      if (await transaction.insertIfAbsent(branch)) {
        created++;
      } else {
        existing++;
      }
    }

    return { created, existing, rejected };
  });
}

function createPostgresBranchSeedStore(
  db: ReturnType<typeof drizzle>,
): BranchSeedStore {
  return {
    transaction: (operation) =>
      db.transaction((transaction) =>
        operation({
          async insertIfAbsent(branch) {
            const inserted = await transaction
              .insert(branches)
              .values(branch)
              .onConflictDoNothing({ target: branches.slug })
              .returning({ id: branches.id });
            return inserted.length === 1;
          },
        }),
      ),
  };
}

export async function runBranchesSeedCommand(): Promise<BranchSeedResult> {
  const pool = new Pool({ connectionString: getRequiredSeedDatabaseUrl(process.env.DATABASE_URL) });
  const db = drizzle(pool);

  try {
    const result = await runBranchesSeed(createPostgresBranchSeedStore(db), initialBranches);
    console.log(
      `Branches seed completed: created=${result.created}, existing=${result.existing}, rejected=${result.rejected}`,
    );
    return result;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBranchesSeedCommand().catch((error: unknown) => {
    console.error('Branches seed failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exitCode = 1;
  });
}
