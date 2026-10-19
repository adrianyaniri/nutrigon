import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import { categories, products, users } from './schema/index.js';

const { Pool } = pg;

function parseCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const rows: string[][] = [];
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);
    rows.push(row);
  }
  return rows;
}

function findDataDir(): string {
  const candidates = [
    process.env.DATA_DIR,
    path.resolve(process.cwd(), 'data'),
    path.resolve(process.cwd(), '../data'),
    path.resolve(process.cwd(), '../../data'),
    path.resolve(import.meta.dirname, '../../../../data'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (
      fs.existsSync(candidate) &&
      fs.existsSync(path.resolve(candidate, 'categories.csv')) &&
      fs.existsSync(path.resolve(candidate, 'products.csv'))
    ) {
      return candidate;
    }
  }

  throw new Error(
    `Directory containing categories.csv and products.csv not found. Searched in: ${candidates.join(', ')}`,
  );
}

async function runSeed() {
  console.log('🌱 Starting database seeding process...');
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    const dataDir = findDataDir();
    console.log(`📂 Using data source directory: ${dataDir}`);

    // 1. Seed Categories
    console.log('📦 Seeding categories...');
    const categoriesCsvPath = path.resolve(dataDir, 'categories.csv');
    const categoriesContent = fs.readFileSync(categoriesCsvPath, 'utf8');
    const categoryRows = parseCsv(categoriesContent).slice(1); // skip header

    for (const [name, slug, orderIndex, isActive] of categoryRows) {
      if (!name || !slug) continue;
      await db
        .insert(categories)
        .values({
          name,
          slug,
          orderIndex: Number.parseInt(orderIndex || '0', 10),
          isActive: isActive === 'true',
        })
        .onConflictDoNothing({ target: categories.slug });
    }

    const allCategories = await db.select().from(categories);
    console.log(`✅ Categories seeded: ${allCategories.length}`);
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]));
    const fallbackCategoryId =
      categoryMap.get('sin-departamento') || allCategories[0]!.id;

    // 2. Seed Master Products (idempotent check)
    const existingProductCountRes = await db
      .select({ total: count() })
      .from(products);
    const existingProductCount = Number(existingProductCountRes[0]?.total ?? 0);

    let insertedCount = existingProductCount;
    if (existingProductCount === 0) {
      console.log('📦 Seeding master products...');
      const productsCsvPath = path.resolve(dataDir, 'products.csv');
      const productsContent = fs.readFileSync(productsCsvPath, 'utf8');
      const productRows = parseCsv(productsContent).slice(1);

      const productValues = productRows
        .filter(([, name]) => Boolean(name && name.trim()))
        .map(([code, name, categorySlug, saleUnit, isActive, description]) => {
          const categoryId = categoryMap.get(categorySlug!) || fallbackCategoryId;
          return {
            code: code || null,
            name: name!,
            categoryId,
            saleUnit: saleUnit === 'WEIGHT' ? 'WEIGHT' : 'UNIT',
            description: description || null,
            isActive: isActive === 'true',
            imageUrls: [],
          };
        });

      const batchSize = 200;
      insertedCount = 0;
      for (let i = 0; i < productValues.length; i += batchSize) {
        const chunk = productValues.slice(i, i + batchSize);
        await db.insert(products).values(chunk);
        insertedCount += chunk.length;
      }
      console.log(`✅ Master products seeded: ${insertedCount}`);
    } else {
      console.log(`✅ Products already present: ${existingProductCount}`);
    }

    // 3. Seed Initial General Admin User
    console.log('📦 Seeding initial General Admin user...');
    const adminEmail = env.INITIAL_ADMIN_EMAIL;
    const adminPassword = env.INITIAL_ADMIN_PASSWORD;

    if (env.NODE_ENV === 'production' && adminPassword === 'AdminNutrigon2026!') {
      console.warn(
        '⚠️  SECURITY WARNING: Using default password in production. Please set INITIAL_ADMIN_PASSWORD in environment variables.',
      );
    }

    const passwordHash = await argon2.hash(adminPassword);

    await db
      .insert(users)
      .values({
        email: adminEmail,
        fullName: 'Administrador General',
        passwordHash,
        role: 'ADMIN_GENERAL',
        branchId: null,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash,
          fullName: 'Administrador General',
          role: 'ADMIN_GENERAL',
          isActive: true,
          updatedAt: new Date(),
        },
      });

    console.log(`✅ General Admin user ready: ${adminEmail}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log(`📌 Categorías: ${allCategories.length}`);
    console.log(`📌 Productos Maestros: ${insertedCount}`);
    console.log(`📌 Usuario Administrador General: ${adminEmail}`);
    console.log('📌 Sucursales y Usuarios de Sucursal:');
    console.log('   (Deben ser creados desde el Panel de Administración)');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
