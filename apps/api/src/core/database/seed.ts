import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { eq, count } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import {
  branches,
  categories,
  products,
  branchProducts,
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

    // 3. Seed Products (idempotent check)
    const existingProductCountRes = await db
      .select({ total: count() })
      .from(products);
    const existingProductCount = Number(existingProductCountRes[0]?.total ?? 0);

    let insertedCount = existingProductCount;
    if (existingProductCount === 0) {
      console.log('📦 Seeding products (2,257 items)...');
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
      console.log(`✅ Products seeded: ${insertedCount}`);
    } else {
      console.log(`✅ Products already present: ${existingProductCount}`);
    }

    // 4. Seed Initial Users
    console.log('📦 Seeding initial admin users...');
    const generalAdminPasswordHash = await argon2.hash('AdminNutrigon2026!');
    const branchAdminPasswordHash = await argon2.hash('BranchAdmin2026!');

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

    // 5. Seed Initial Branch Products (Commercial configuration per branch)
    console.log('📦 Seeding initial branch products...');
    const sampleProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .limit(40);

    const priceFactors: Record<string, number> = {
      origone: 1.0,
      'pedro-diaz': 1.05,
      'w-morris': 0.98,
    };

    const branchProductValues = [];
    for (const branch of allBranches) {
      const factor = priceFactors[branch.slug] ?? 1.0;

      for (let idx = 0; idx < sampleProducts.length; idx++) {
        const prod = sampleProducts[idx]!;
        const basePrice = prod.saleUnit === 'WEIGHT' ? 6500 + (idx % 10) * 800 : 1800 + (idx % 8) * 350;
        const finalPrice = Math.round((basePrice * factor) / 50) * 50;
        const isAvailable = idx % 7 !== 0; // ~85% active, ~15% hidden/inactive
        const isOnSale = isAvailable && idx % 5 === 0;
        const promotionalPrice = isOnSale
          ? (Math.round((finalPrice * 0.85) / 50) * 50).toFixed(2)
          : null;

        branchProductValues.push({
          branchId: branch.id,
          productId: prod.id,
          price: finalPrice.toFixed(2),
          promotionalPrice,
          isOnSale,
          isAvailable,
        });
      }
    }

    if (branchProductValues.length > 0) {
      await db
        .insert(branchProducts)
        .values(branchProductValues)
        .onConflictDoNothing({
          target: [branchProducts.branchId, branchProducts.productId],
        });
    }

    const totalBranchProductsRes = await db
      .select({ total: count() })
      .from(branchProducts);
    const totalBranchProducts = Number(totalBranchProductsRes[0]?.total ?? 0);
    console.log(`✅ Branch products configured: ${totalBranchProducts}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('--------------------------------------------------');
    console.log('📌 Sucursales: Origone, Pedro Diaz, W Morris');
    console.log(`📌 Categorías: ${allCategories.length}`);
    console.log(`📌 Productos Maestros: ${insertedCount}`);
    console.log(`📌 Productos por Sucursal: ${totalBranchProducts}`);
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

