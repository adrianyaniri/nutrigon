import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const { Pool } = pg;

async function run() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/nutrigon';

  console.log('[Migrator] Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  // In local development or container execution, locate the drizzle folder relative to cwd or apps/api
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  console.log(`[Migrator] Applying migrations from: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log('[Migrator] All database migrations applied successfully.');
  } catch (error) {
    console.error('[Migrator] Migration execution failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
