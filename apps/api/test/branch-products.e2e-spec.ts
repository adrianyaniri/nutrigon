import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { eq } from 'drizzle-orm';
import { AppModule } from '../src/app.module.js';
import { DRIZZLE_CLIENT } from '../src/core/database/database.constants.js';
import * as schema from '../src/core/database/schema/index.js';
import { BranchProductStatus, SaleUnit } from '@nutrigon/contracts';

describe('BranchProductsModule (e2e)', () => {
  let app: INestApplication<App>;
  let adminGeneralToken: string;
  let branchAdminToken: string;
  let branchAdminBranchId: string;
  let branchAdminSlug: string;
  let otherBranchId: string;
  let testProductId: string;

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

    // Login BRANCH_ADMIN (Origone)
    const branchRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.origone@nutrigon.com',
        password: 'BranchAdmin2026!',
      });
    branchAdminToken = branchRes.body.accessToken;
    branchAdminBranchId = branchRes.body.user.branchId;

    // Get branches to find slug and another branch ID
    const branchesRes = await request(app.getHttpServer()).get('/api/v1/branches');
    const ownBranch = branchesRes.body.find((b: any) => b.id === branchAdminBranchId);
    branchAdminSlug = ownBranch.slug;
    const otherBranch = branchesRes.body.find((b: any) => b.id !== branchAdminBranchId);
    otherBranchId = otherBranch.id;

    // Create a temporary master product for E2E branch-product tests
    const catRes = await request(app.getHttpServer()).get('/api/v1/categories');
    const firstCategoryId = catRes.body[0].id;

    const prodRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminGeneralToken}`)
      .send({
        categoryId: firstCategoryId,
        name: 'Producto BranchSpec Config',
        saleUnit: SaleUnit.WEIGHT,
        imageUrls: [],
      });
    testProductId = prodRes.body.id;
  });

  afterAll(async () => {
    try {
      const db = app.get(DRIZZLE_CLIENT);
      if (testProductId) {
        await db
          .delete(schema.branchProducts)
          .where(eq(schema.branchProducts.productId, testProductId));
        await db
          .delete(schema.products)
          .where(eq(schema.products.id, testProductId));
      }
    } finally {
      await app.close();
    }
  });

  describe('GET /api/v1/branches/:branchId/products', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/branches/${branchAdminBranchId}/products`)
        .expect(401);
    });

    it('returns 403 when BRANCH_ADMIN queries another branch', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/branches/${otherBranchId}/products`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .expect(403);
    });

    it('returns paginated branch products with UNCONFIGURED status for new master product', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/branches/${branchAdminBranchId}/products?search=Producto%20BranchSpec%20Config`,
        )
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .expect(200);

      const found = res.body.items.find((i: any) => i.productId === testProductId);
      expect(found).toBeDefined();
      expect(found.status).toBe(BranchProductStatus.UNCONFIGURED);
      expect(found.price).toBeNull();
      expect(found.isAvailable).toBe(false);
    });
  });

  describe('GET /api/v1/branches/:branchId/products/counts', () => {
    it('returns status counts for the branch', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/branches/${branchAdminBranchId}/products/counts`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .expect(200);

      expect(typeof res.body[BranchProductStatus.ACTIVE]).toBe('number');
      expect(typeof res.body[BranchProductStatus.INACTIVE]).toBe('number');
      expect(typeof res.body[BranchProductStatus.UNCONFIGURED]).toBe('number');
    });
  });

  describe('PUT /api/v1/branches/:branchId/products/:productId', () => {
    it('returns 403 when BRANCH_ADMIN attempts to configure another branch', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/branches/${otherBranchId}/products/${testProductId}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({ price: 4500, isAvailable: true })
        .expect(403);
    });

    it('returns 400 when activating a product with price 0', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/branches/${branchAdminBranchId}/products/${testProductId}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({ price: 0, isAvailable: true })
        .expect(400);
    });

    it('upserts price and activates the product for the branch', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/branches/${branchAdminBranchId}/products/${testProductId}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({ price: 6200, isAvailable: true })
        .expect(200);

      expect(res.body.branchId).toBe(branchAdminBranchId);
      expect(res.body.productId).toBe(testProductId);
      expect(res.body.price).toBe(6200);
      expect(res.body.isAvailable).toBe(true);
    });
  });

  describe('GET /api/v1/branches/:slug/catalog', () => {
    it('publicly lists the newly activated product along with branch metadata and categories', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/branches/${branchAdminSlug}/catalog?search=Producto%20BranchSpec%20Config`,
        )
        .expect(200);

      expect(res.body.branch.id).toBe(branchAdminBranchId);
      expect(res.body.branch.slug).toBe(branchAdminSlug);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBeGreaterThan(0);

      const found = res.body.items.find((i: any) => i.id === testProductId);
      expect(found).toBeDefined();
      expect(found.price).toBe(6200);
      expect(found.priceUnitLabel).toBe('kg');
    });
  });
});
