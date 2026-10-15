import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import {
  branches,
  categories,
  products,
  users,
} from './schema/index.js';

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

async function runSeed() {
  console.log('🌱 Starting database seeding process...');
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    const rootDir = path.resolve(process.cwd(), '../..');
    const dataDir = path.resolve(rootDir, 'data');

    // 1. Seed Branches
    console.log('📦 Seeding branches...');
    const branchesCsvPath = path.resolve(dataDir, 'branches.csv');
    const branchesContent = fs.readFileSync(branchesCsvPath, 'utf8');
    const branchRows = parseCsv(branchesContent).slice(1); // skip header

    for (const [name, slug, address, phone, whatsappNumber, isActive] of branchRows) {
      if (!name || !slug) continue;
      await db
        .insert(branches)
        .values({
          name,
          slug,
          address: address || null,
          phone: phone || null,
          whatsappNumber: whatsappNumber || null,
          isActive: isActive === 'true',
        })
        .onConflictDoNothing({ target: branches.slug });
    }
    const allBranches = await db.select().from(branches);
    console.log(`✅ Branches seeded: ${allBranches.length}`);
    const branchMap = new Map(allBranches.map((b) => [b.slug, b.id]));

    // 2. Seed Categories
    console.log('📦 Seeding categories...');
    const categoriesCsvPath = path.resolve(dataDir, 'categories.csv');
    const categoriesContent = fs.readFileSync(categoriesCsvPath, 'utf8');
    const categoryRows = parseCsv(categoriesContent).slice(1);

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

    // 3. Seed Products
    console.log('📦 Seeding products (2,257 items)...');
    const productsCsvPath = path.resolve(dataDir, 'products.csv');
    const productsContent = fs.readFileSync(productsCsvPath, 'utf8');
    const productRows = parseCsv(productsContent).slice(1);

    const productValues = productRows
      .filter(([_, name]) => Boolean(name && name.trim()))
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

    // Batch insert 200 items per chunk
    const batchSize = 200;
    let insertedCount = 0;
    for (let i = 0; i < productValues.length; i += batchSize) {
      const chunk = productValues.slice(i, i + batchSize);
      await db.insert(products).values(chunk);
      insertedCount += chunk.length;
    }
    console.log(`✅ Products seeded: ${insertedCount}`);

    // 4. Seed Initial Users
    console.log('📦 Seeding initial admin users...');
    const generalAdminPasswordHash = await argon2.hash('AdminNutrigon2026!');
    const branchAdminPasswordHash = await argon2.hash('BranchAdmin2026!');

    // Admin General
    await db
      .insert(users)
      .values({
        email: 'admin@nutrigon.com',
        fullName: 'Administrador General',
        passwordHash: generalAdminPasswordHash,
        role: 'ADMIN_GENERAL',
        branchId: null,
        isActive: true,
      })
      .onConflictDoNothing({ target: users.email });

    // Branch Admins
    const branchAdmins = [
      {
        email: 'admin.origone@nutrigon.com',
        fullName: 'Admin Origone',
        branchSlug: 'origone',
      },
      {
        email: 'admin.pedrodiaz@nutrigon.com',
        fullName: 'Admin Pedro Diaz',
        branchSlug: 'pedro-diaz',
      },
      {
        email: 'admin.wmorris@nutrigon.com',
        fullName: 'Admin W Morris',
        branchSlug: 'w-morris',
      },
    ];

    for (const admin of branchAdmins) {
      const branchId = branchMap.get(admin.branchSlug);
      if (!branchId) continue;
      await db
        .insert(users)
        .values({
          email: admin.email,
          fullName: admin.fullName,
          passwordHash: branchAdminPasswordHash,
          role: 'BRANCH_ADMIN',
          branchId,
          isActive: true,
        })
        .onConflictDoNothing({ target: users.email });
    }

    const allUsers = await db.select().from(users);
    console.log(`✅ Users seeded: ${allUsers.length}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('📌 Sucursales: Origone, Pedro Diaz, W Morris');
    console.log(`📌 Categorías: ${allCategories.length}`);
    console.log(`📌 Productos: ${insertedCount}`);
    console.log('📌 Usuarios Admin iniciales:');
    console.log('   - admin@nutrigon.com (Pass: AdminNutrigon2026!) -> ADMIN_GENERAL');
    console.log('   - admin.origone@nutrigon.com (Pass: BranchAdmin2026!) -> Sucursal Origone');
    console.log('   - admin.pedrodiaz@nutrigon.com (Pass: BranchAdmin2026!) -> Sucursal Pedro Diaz');
    console.log('   - admin.wmorris@nutrigon.com (Pass: BranchAdmin2026!) -> Sucursal W Morris');
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
