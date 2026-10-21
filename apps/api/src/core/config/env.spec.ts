import { describe, expect, it } from 'vitest';
import { DEFAULT_DEVELOPMENT_JWT_SECRET, validateEnv } from './env.js';

const productionConfig = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/nutrigon',
  JWT_SECRET: 'a'.repeat(64),
};

describe('validateEnv', () => {
  it('rejects production startup when JWT_SECRET is missing', () => {
    expect(() => validateEnv({ ...productionConfig, JWT_SECRET: undefined })).toThrow(
      'Environment validation failed',
    );
  });

  it('rejects production startup when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _databaseUrl, ...configWithoutDatabaseUrl } = productionConfig;

    expect(() => validateEnv(configWithoutDatabaseUrl)).toThrow('Environment validation failed');
  });

  it('rejects the development JWT secret in production', () => {
    expect(() =>
      validateEnv({ ...productionConfig, JWT_SECRET: DEFAULT_DEVELOPMENT_JWT_SECRET }),
    ).toThrow('Environment validation failed');
  });

  it('rejects a production JWT secret shorter than 64 characters', () => {
    expect(() =>
      validateEnv({ ...productionConfig, JWT_SECRET: 'not-long-enough-for-production' }),
    ).toThrow('Environment validation failed');
  });

  it('accepts a secure explicit JWT secret in production', () => {
    expect(validateEnv(productionConfig).JWT_SECRET).toBe(productionConfig.JWT_SECRET);
  });

  it('rejects a missing JWT secret outside development', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'test',
        DATABASE_URL: productionConfig.DATABASE_URL,
      }),
    ).toThrow('Environment validation failed');
  });

  it('keeps the fallback JWT secret for local development', () => {
    expect(
      validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL: productionConfig.DATABASE_URL,
      }).JWT_SECRET,
    ).toBe(DEFAULT_DEVELOPMENT_JWT_SECRET);
  });
});
