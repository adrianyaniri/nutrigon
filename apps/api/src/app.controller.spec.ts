import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PG_CONNECTION_POOL } from './core/database/database.constants.js';

describe('AppController (TDD)', () => {
  let appController: AppController;
  let shouldFailDb = false;

  beforeEach(async () => {
    shouldFailDb = false;
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PG_CONNECTION_POOL,
          useValue: {
            query: async () => {
              if (shouldFailDb) {
                throw new Error('Connection refused');
              }
              return { rows: [{ '?column?': 1 }] };
            },
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('returns ok status and connected database when SELECT 1 succeeds', async () => {
      const result = await appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(typeof result.timestamp).toBe('string');
    });

    it('throws ServiceUnavailableException when database ping fails', async () => {
      shouldFailDb = true;
      await expect(appController.getHealth()).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
