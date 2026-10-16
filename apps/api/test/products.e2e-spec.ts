import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { like } from 'drizzle-orm';
import { AppModule } from '../src/app.module.js';
import { DRIZZLE_CLIENT } from '../src/core/database/database.constants.js';
import * as schema from '../src/core/database/schema/index.js';
import { SaleUnit } from '@nutrigon/contracts';

describe('ProductsModule (e2e)', () => {
  let app: INestApplication<App>;
  let adminGeneralToken: string;
  let branchAdminToken: string;
  let firstCategoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Login ADMIN_GENERAL
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@nutrigon.com',
        password: 'AdminNutrigon2026!',
      });
    adminGeneralToken = adminRes.body.accessToken;

    // Login BRANCH_ADMIN
    const branchRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.origone@nutrigon.com',
        password: 'BranchAdmin2026!',
      });
    branchAdminToken = branchRes.body.accessToken;

    // Get an active category ID from seeded categories
    const catRes = await request(app.getHttpServer()).get('/api/v1/categories');
    firstCategoryId = catRes.body[0].id;
  });

  afterAll(async () => {
    try {
      const db = app.get(DRIZZLE_CLIENT);
      await db.delete(schema.products).where(like(schema.products.name, '%E2E%'));
    } finally {
      await app.close();
    }
  });

  describe('GET /api/v1/products', () => {
    it('should return 401 when accessed without token (Admin only master catalog)', async () => {
      await request(app.getHttpServer()).get('/api/v1/products').expect(401);
    });

    it('should return 200 and paginated products when accessed by BRANCH_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?limit=10&page=1')
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body.items.length).toBeLessThanOrEqual(10);
      expect(response.body.total).toBeGreaterThanOrEqual(2000);
    });

    it('should filter products by search term', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products?search=almendra')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThan(0);
      const allMatch = response.body.items.every((p: any) =>
        p.name.toLowerCase().includes('almendra'),
      );
      expect(allMatch).toBe(true);
    });

    it('should filter products by search term matching internal code or barcode', async () => {
      const uniqueCode = `CODE-E2E-${Date.now()}`;
      const uniqueBarcode = `7799999${Date.now().toString().slice(-6)}`;

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          categoryId: firstCategoryId,
          name: 'Producto E2E Busqueda Código',
          saleUnit: SaleUnit.UNIT,
          code: uniqueCode,
          barcode: uniqueBarcode,
        })
        .expect(201);

      const createdId = createRes.body.id;

      // 1. Search by internal code in ?search=
      const searchByCodeRes = await request(app.getHttpServer())
        .get(`/api/v1/products?search=${uniqueCode}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .expect(200);

      expect(searchByCodeRes.body.items.some((p: any) => p.id === createdId)).toBe(true);

      // 2. Search by barcode in ?search=
      const searchByBarcodeRes = await request(app.getHttpServer())
        .get(`/api/v1/products?search=${uniqueBarcode}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .expect(200);

      expect(searchByBarcodeRes.body.items.some((p: any) => p.id === createdId)).toBe(true);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return product details by id', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/products?limit=1')
        .set('Authorization', `Bearer ${adminGeneralToken}`);

      const firstProduct = listRes.body.items[0];

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${firstProduct.id}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .expect(200);

      expect(response.body.id).toBe(firstProduct.id);
      expect(response.body.name).toBe(firstProduct.name);
    });

    it('should return 404 for unknown product id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/products', () => {
    it('should return 403 when creating product as BRANCH_ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({
          categoryId: firstCategoryId,
          name: 'Producto E2E No Autorizado',
          saleUnit: SaleUnit.UNIT,
        })
        .expect(403);
    });

    it('should return 201 when creating product as ADMIN_GENERAL', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          categoryId: firstCategoryId,
          name: 'Producto E2E Creado Exitoso',
          saleUnit: SaleUnit.WEIGHT,
          code: `E2E-${Date.now()}`,
          description: 'Descripción de prueba E2E',
        })
        .expect(201);

      expect(response.body.name).toBe('Producto E2E Creado Exitoso');
      expect(response.body.saleUnit).toBe('WEIGHT');
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    it('should return 403 when updating product as BRANCH_ADMIN', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/products?limit=1')
        .set('Authorization', `Bearer ${adminGeneralToken}`);

      const firstProduct = listRes.body.items[0];

      await request(app.getHttpServer())
        .patch(`/api/v1/products/${firstProduct.id}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({ description: 'Intento no autorizado' })
        .expect(403);
    });

    it('should return 200 when updating product as ADMIN_GENERAL', async () => {
      // Create a temporary product to update
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          categoryId: firstCategoryId,
          name: 'Producto E2E Para Editar',
          saleUnit: SaleUnit.UNIT,
        });

      const tempId = createRes.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${tempId}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          name: 'Producto E2E Editado con Exito',
          description: 'Nueva descripción actualizada',
        })
        .expect(200);

      expect(response.body.name).toBe('Producto E2E Editado con Exito');
      expect(response.body.description).toBe('Nueva descripción actualizada');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should return 403 when deleting product as BRANCH_ADMIN', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/products?limit=1')
        .set('Authorization', `Bearer ${adminGeneralToken}`);

      const firstProduct = listRes.body.items[0];

      await request(app.getHttpServer())
        .delete(`/api/v1/products/${firstProduct.id}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .expect(403);
    });

    it('should return 200 and soft-delete product atomically as ADMIN_GENERAL', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          categoryId: firstCategoryId,
          name: 'Producto E2E Para Borrar',
          saleUnit: SaleUnit.WEIGHT,
        });

      const tempId = createRes.body.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/products/${tempId}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .expect(200);

      expect(deleteRes.body.isActive).toBe(false);

      // Verify it is deactivated
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/products/${tempId}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`);

      expect(getRes.body.isActive).toBe(false);
    });
  });
});
