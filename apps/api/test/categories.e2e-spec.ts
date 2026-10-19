import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

import { like } from 'drizzle-orm';
import { DRIZZLE_CLIENT } from '../src/core/database/database.constants.js';
import * as schema from '../src/core/database/schema/index.js';

describe('CategoriesModule (e2e)', () => {
  let app: INestApplication<App>;
  let adminGeneralToken: string;
  let branchAdminToken: string;

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
  });

  afterAll(async () => {
    try {
      const db = app.get(DRIZZLE_CLIENT);
      await db.delete(schema.categories).where(like(schema.categories.name, '%E2E%'));
    } finally {
      await app.close();
    }
  });

  describe('GET /api/v1/categories', () => {
    it('should return 200 and list of active categories without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(20);

      const slugs = response.body.map((c: any) => c.slug);
      expect(slugs).toContain('frutos-secos');
      expect(slugs).toContain('cereales');
    });
  });

  describe('GET /api/v1/categories/:slug', () => {
    it('should return 200 and category details by slug without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/categories/frutos-secos')
        .expect(200);

      expect(response.body.slug).toBe('frutos-secos');
      expect(response.body.isActive).toBe(true);
    });

    it('should return 404 for unknown slug', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/categories/categoria-inexistente')
        .expect(404);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should return 401 when creating category without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Sin Auth', slug: 'sin-auth' })
        .expect(401);
    });

    it('should return 403 when creating category as BRANCH_ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({ name: 'Intento Sucursal', slug: 'intento-sucursal' })
        .expect(403);
    });

    it('should return 201 when creating category as ADMIN_GENERAL', async () => {
      const testSlug = `test-cat-${Date.now()}`;
      const response = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          name: 'Categoría Temporal E2E',
          slug: testSlug,
          orderIndex: 99,
        })
        .expect(201);

      expect(response.body.slug).toBe(testSlug);
      expect(response.body.name).toBe('Categoría Temporal E2E');
      expect(response.body.isActive).toBe(true);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('should return 403 when BRANCH_ADMIN attempts to edit a category', async () => {
      const listRes = await request(app.getHttpServer()).get('/api/v1/categories');
      const firstId = listRes.body[0].id;

      await request(app.getHttpServer())
        .patch(`/api/v1/categories/${firstId}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({ orderIndex: 50 })
        .expect(403);
    });

    it('should return 200 when ADMIN_GENERAL updates category orderIndex', async () => {
      const listRes = await request(app.getHttpServer()).get('/api/v1/categories');
      const firstId = listRes.body[0].id;

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/categories/${firstId}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({ orderIndex: 42 })
        .expect(200);

      expect(response.body.id).toBe(firstId);
      expect(response.body.orderIndex).toBe(42);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should return 403 when BRANCH_ADMIN attempts to delete category', async () => {
      const listRes = await request(app.getHttpServer()).get('/api/v1/categories');
      const firstId = listRes.body[0].id;

      await request(app.getHttpServer())
        .delete(`/api/v1/categories/${firstId}`)
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .expect(403);
    });

    it('should return 200 and soft delete when ADMIN_GENERAL deletes a category', async () => {
      const tempSlug = `cat-del-${Date.now()}`;
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          name: 'Para Borrar E2E',
          slug: tempSlug,
        });

      const tempId = createRes.body.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/categories/${tempId}`)
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .expect(200);

      expect(deleteRes.body.isActive).toBe(false);

      // Verify it is no longer returned in active list
      const listRes = await request(app.getHttpServer()).get('/api/v1/categories');
      const activeSlugs = listRes.body.map((c: any) => c.slug);
      expect(activeSlugs).not.toContain(tempSlug);
    });
  });
});
