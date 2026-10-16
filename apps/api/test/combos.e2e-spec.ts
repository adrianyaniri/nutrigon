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

describe('CombosModule (e2e)', () => {
  let app: INestApplication<App>;
  let adminGeneralToken: string;
  let branchAdminToken: string;
  let branchAdminBranchId: string;
  let branchAdminSlug: string;
  let otherBranchId: string;
  let product1Id: string;
  let product2Id: string;
  let createdComboId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.setGlobalPrefix('api/v1');
    await app.init();

    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@nutrigon.com',
        password: 'AdminNutrigon2026!',
      });
    adminGeneralToken = adminRes.body.accessToken;

    const branchRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.origone@nutrigon.com',
        password: 'BranchAdmin2026!',
      });
    branchAdminToken = branchRes.body.accessToken;
    branchAdminBranchId = branchRes.body.user.branchId;

    const branchesRes = await request(app.getHttpServer()).get('/api/v1/branches');
    const ownBranch = branchesRes.body.find((b: any) => b.id === branchAdminBranchId);
    branchAdminSlug = ownBranch.slug;
    const otherBranch = branchesRes.body.find((b: any) => b.id !== branchAdminBranchId);
    otherBranchId = otherBranch.id;

    const prodsRes = await request(app.getHttpServer())
      .get('/api/v1/products?limit=2&isActive=true')
      .set('Authorization', `Bearer ${adminGeneralToken}`);
    product1Id = prodsRes.body.items[0].id;
    product2Id = prodsRes.body.items[1].id;
  });

  afterAll(async () => {
    try {
      const db = app.get(DRIZZLE_CLIENT);
      if (createdComboId) {
        await db.delete(schema.combos).where(eq(schema.combos.id, createdComboId));
      }
    } finally {
      await app.close();
    }
  });

  it('returns 403 when BRANCH_ADMIN attempts to create a combo for another branch', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/branches/${otherBranchId}/combos`)
      .set('Authorization', `Bearer ${branchAdminToken}`)
      .send({
        name: 'Combo Ajeno',
        price: 9000,
        items: [
          { productId: product1Id, quantity: 1 },
          { productId: product2Id, quantity: 1 },
        ],
      })
      .expect(403);
  });

  it('returns 400 when combo has fewer than 2 items', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/branches/${branchAdminBranchId}/combos`)
      .set('Authorization', `Bearer ${branchAdminToken}`)
      .send({
        name: 'Combo Incompleto',
        price: 9000,
        items: [{ productId: product1Id, quantity: 1 }],
      })
      .expect(400);
  });

  it('creates a combo for the branch as BRANCH_ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/branches/${branchAdminBranchId}/combos`)
      .set('Authorization', `Bearer ${branchAdminToken}`)
      .send({
        name: 'Mix Energético Origone',
        description: 'Combo exclusivo sucursal Origone',
        price: 11500,
        isAvailable: true,
        items: [
          { productId: product1Id, quantity: 0.5 },
          { productId: product2Id, quantity: 0.5 },
        ],
      })
      .expect(201);

    createdComboId = res.body.id;
    expect(res.body.name).toBe('Mix Energético Origone');
    expect(res.body.price).toBe(11500);
    expect(res.body.items).toHaveLength(2);
  });

  it('lists the combo publicly in GET /api/v1/branches/:slug/combos', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/branches/${branchAdminSlug}/combos`)
      .expect(200);

    const found = res.body.find((c: any) => c.id === createdComboId);
    expect(found).toBeDefined();
    expect(found.price).toBe(11500);
    expect(found.priceUnitLabel).toBe('combo');
  });

  it('updates and soft-deletes the branch combo', async () => {
    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/branches/${branchAdminBranchId}/combos/${createdComboId}`)
      .set('Authorization', `Bearer ${branchAdminToken}`)
      .send({
        price: 10900,
      })
      .expect(200);

    expect(updateRes.body.price).toBe(10900);

    const delRes = await request(app.getHttpServer())
      .delete(`/api/v1/branches/${branchAdminBranchId}/combos/${createdComboId}`)
      .set('Authorization', `Bearer ${branchAdminToken}`)
      .expect(200);

    expect(delRes.body.isActive).toBe(false);
    expect(delRes.body.isAvailable).toBe(false);

    const publicAfter = await request(app.getHttpServer())
      .get(`/api/v1/branches/${branchAdminSlug}/combos`)
      .expect(200);
    const foundAfter = publicAfter.body.find((c: any) => c.id === createdComboId);
    expect(foundAfter).toBeUndefined();
  });
});
