import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('AuthModule (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet());
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return security headers from helmet', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('POST /api/v1/auth/login with valid credentials should return 200 and JWT access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@nutrigon.com',
        password: 'AdminNutrigon2026!',
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('admin@nutrigon.com');
    expect(response.body.user.role).toBe('ADMIN_GENERAL');
  });

  it('POST /api/v1/auth/login with invalid password should return 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@nutrigon.com',
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  it('POST /api/v1/auth/login with unknown email should return 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@nutrigon.com',
        password: 'Password123!',
      })
      .expect(401);
  });

  it('GET /api/v1/auth/me should return 401 without Bearer token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('GET /api/v1/auth/me should return 200 with valid Bearer token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.origone@nutrigon.com',
        password: 'BranchAdmin2026!',
      })
      .expect(200);

    const token = loginRes.body.accessToken;

    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.email).toBe('admin.origone@nutrigon.com');
    expect(meRes.body.role).toBe('BRANCH_ADMIN');
    expect(meRes.body.branchId).toBeDefined();
  });

  it('POST /api/v1/auth/login should enforce rate limiting (429) when exceeding 5 requests/min', async () => {
    // 5th attempt was made across previous tests; 6th attempt must trigger 429
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@nutrigon.com',
        password: 'Attempt5',
      });

    const blockedRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@nutrigon.com',
        password: 'AdminNutrigon2026!',
      });

    expect(blockedRes.status).toBe(429);
  });
});
