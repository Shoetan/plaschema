import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://plaschema:plaschema@localhost:5432/plaschema',
    REDIS_URL: 'redis://localhost:6379',
    LOG_LEVEL: 'info',
    CORS_ORIGIN: 'http://localhost:5173',
    SWAGGER_ENABLED: 'true',
    JWT_SECRET: 'test-jwt-secret-16',
    JWT_EXPIRES_IN: '8h',
    OBJECT_STORAGE_PROVIDER: 'railway',
    OBJECT_STORAGE_BUCKET_NAME: 'test-bucket',
    OBJECT_STORAGE_ENDPOINT: 'https://t3.storageapi.dev',
    OBJECT_STORAGE_ACCESS_KEY_ID: 'test-access-key',
    OBJECT_STORAGE_SECRET_ACCESS_KEY: 'test-secret-key',
    OBJECT_STORAGE_REGION: 'auto',
  };

  it('accepts a valid configuration', () => {
    const env = validateEnv(validEnv);

    expect(env.PORT).toBe(3000);
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.DATABASE_URL).toContain('postgresql://');
    expect(env.JWT_SECRET).toBe('test-jwt-secret-16');
    expect(env.OBJECT_STORAGE_BUCKET_NAME).toBe('test-bucket');
    expect(env.OBJECT_STORAGE_PRESIGN_TTL_SECONDS).toBe(1800);
  });

  it('rejects missing DATABASE_URL', () => {
    const withoutDatabase: Record<string, unknown> = {
      NODE_ENV: 'test',
      PORT: '3000',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'info',
      CORS_ORIGIN: 'http://localhost:5173',
      SWAGGER_ENABLED: 'true',
      JWT_SECRET: 'test-jwt-secret-16',
      OBJECT_STORAGE_BUCKET_NAME: 'test-bucket',
      OBJECT_STORAGE_ENDPOINT: 'https://t3.storageapi.dev',
      OBJECT_STORAGE_ACCESS_KEY_ID: 'test-access-key',
      OBJECT_STORAGE_SECRET_ACCESS_KEY: 'test-secret-key',
    };

    expect(() => validateEnv(withoutDatabase)).toThrow(/DATABASE_URL/);
  });

  it('rejects short JWT_SECRET', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        JWT_SECRET: 'short',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects missing object storage credentials', () => {
    const withoutKeys: Record<string, unknown> = { ...validEnv };
    delete withoutKeys.OBJECT_STORAGE_ACCESS_KEY_ID;

    expect(() => validateEnv(withoutKeys)).toThrow(
      /OBJECT_STORAGE_ACCESS_KEY_ID/,
    );
  });

  it('defaults OBJECT_STORAGE_PRESIGN_TTL_SECONDS to 30 minutes', () => {
    const env = validateEnv(validEnv);
    expect(env.OBJECT_STORAGE_PRESIGN_TTL_SECONDS).toBe(1800);
  });
});
