import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('MediaModule (e2e)', () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/media/upload-url', () => {
    it('returns 401 without JWT token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/media/upload-url')
        .send({
          fileName: 'almendras.webp',
          contentType: 'image/webp',
          folder: 'products',
        })
        .expect(401);
    });

    it('returns 403 when called by BRANCH_ADMIN', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${branchAdminToken}`)
        .send({
          fileName: 'almendras.webp',
          contentType: 'image/webp',
          folder: 'products',
        })
        .expect(403);
    });

    it('returns 400 when extension is unsupported (e.g. .svg)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          fileName: 'malicious.svg',
          contentType: 'image/webp',
          folder: 'products',
        })
        .expect(400);
    });

    it('returns 400 when extension and contentType do not match', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          fileName: 'almendras.png',
          contentType: 'image/webp',
          folder: 'products',
        })
        .expect(400);
    });

    it('returns 200 and presigned uploadUrl, publicUrl and key for ADMIN_GENERAL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${adminGeneralToken}`)
        .send({
          fileName: 'almendras-nonpareil.webp',
          contentType: 'image/webp',
          folder: 'products',
        })
        .expect(200);

      expect(res.body.key).toMatch(/^products\/[0-9a-f-]{36}\.webp$/);
      expect(res.body.uploadUrl).toContain(res.body.key);
      expect(res.body.publicUrl).toContain(res.body.key);
    });
  });
});
