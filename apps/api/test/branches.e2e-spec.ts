import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { or, like } from 'drizzle-orm';
import { AppModule } from '../src/app.module.js';
import { DRIZZLE_CLIENT } from '../src/core/database/database.constants.js';
import * as schema from '../src/core/database/schema/index.js';

describe('BranchesModule (e2e)', () => {
  let app: INestApplication<App>;
  let adminGeneralToken: string;
  let branchAdminOrigoneToken: string;
  let origoneBranchId: string;
  let pedroDiazBranchId: string;

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
    const branchAdminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.origone@nutrigon.com',
        password: 'BranchAdmin2026!',
      });
    branchAdminOrigoneToken = branchAdminRes.body.accessToken;
    origoneBranchId = branchAdminRes.body.user.branchId;

    // Get Pedro Diaz ID
    const pedroRes = await request(app.getHttpServer())
      .get('/api/v1/branches/pedro-diaz');
    pedroDiazBranchId = pedroRes.body.id;
  });

  afterAll(async () => {
    try {
      const db = app.get(DRIZZLE_CLIENT);
      await db.delete(schema.branches).where(
        or(
          like(schema.branches.name, '%Temporal%'),
          like(schema.branches.name, '%Borrar%'),
        ),
      );
    } finally {
      await app.close();
    }
  });

  describe('GET /api/v1/branches', () => {
    it('should return 200 and list of active branches without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/branches')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      const slugs = response.body.map((b: any) => b.slug);
      expect(slugs).toContain('origone');
      expect(slugs).toContain('pedro-diaz');
      expect(slugs).toContain('w-morris');
    });
  });

  describe('GET /api/v1/branches/:slug', () => {
    it('should return 200 and branch details by slug without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/branches/origone')
        .expect(200);

      expect(response.body.slug).toBe('origone');
      expect(response.body.name).toBe('Origone');
      expect(response.body.isActive).toBe(true);
    });

    it('should return 404 for unknown slug', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/branches/sucursal-desconocida')
        .expect(404);
    });
  });

  describe('POST /api/v1/branches', () => {
    it('should return 401 when creating branch without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/branches')
        .send({
          name: 'Nueva Sede',
          slug: 'nueva-sede',
        })
        .expect(401);
    });

    it('should return 403 when creating branch as BRANCH_ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${branchAdminOrigoneToken}`)
        .send({
          name: 'Nueva Sede',
          slug: 'nueva-sede',
        })
        .expect(403);
    });

    it('should return 201 when creating branch as ADMIN_GENERAL', async () => {
      const testSlug = `test-branch-${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          name: 'Sucursal Temporal',
          slug: testSlug,
          address: 'Calle Test 123',
          whatsappNumber: '5491100001111',
        })
        .expect(201);

      expect(response.body.slug).toBe(testSlug);
      expect(response.body.name).toBe('Sucursal Temporal');
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('PATCH /api/v1/branches/:id', () => {
    it('should return 403 when BRANCH_ADMIN attempts to update another branch', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/branches/${pedroDiazBranchId}`)
        .set('Authorization', `Bearer ${branchAdminOrigoneToken}`)
        .send({
          address: 'Intento Ilegal de Cambio',
        })
        .expect(403);
    });

    it('should return 200 when BRANCH_ADMIN updates their own branch', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/branches/${origoneBranchId}`)
        .set('Authorization', `Bearer ${branchAdminOrigoneToken}`)
        .send({
          whatsappNumber: '5491122334455',
          address: 'Origone 1234, Hurlingham',
        })
        .expect(200);

      expect(response.body.id).toBe(origoneBranchId);
      expect(response.body.address).toBe('Origone 1234, Hurlingham');
    });

    it('should return 200 when ADMIN_GENERAL updates any branch', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/branches/${pedroDiazBranchId}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          address: 'Av. Pedro Diaz 5678, Hurlingham',
        })
        .expect(200);

      expect(response.body.id).toBe(pedroDiazBranchId);
      expect(response.body.address).toBe('Av. Pedro Diaz 5678, Hurlingham');
    });
  });

  describe('DELETE /api/v1/branches/:id', () => {
    it('should return 403 when BRANCH_ADMIN attempts to delete a branch', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/branches/${origoneBranchId}`)
        .set('Authorization', `Bearer ${branchAdminOrigoneToken}`)
        .expect(403);
    });

    it('should return 200 and soft delete when ADMIN_GENERAL deletes a branch', async () => {
      // First create a temporary branch to delete
      const tempSlug = `delete-test-${Date.now()}`;
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/branches')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          name: 'Para Borrar',
          slug: tempSlug,
        });

      const tempId = createRes.body.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/branches/${tempId}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .expect(200);

      expect(deleteRes.body.isActive).toBe(false);

      // Verify it is no longer returned in public active list
      const listRes = await request(app.getHttpServer()).get('/api/v1/branches');
      const activeSlugs = listRes.body.map((b: any) => b.slug);
      expect(activeSlugs).not.toContain(tempSlug);
    });
  });
});
