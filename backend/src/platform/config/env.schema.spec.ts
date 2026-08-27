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
  };

  it('accepts a valid configuration', () => {
    const env = validateEnv(validEnv);

    expect(env.PORT).toBe(3000);
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.DATABASE_URL).toContain('postgresql://');
    expect(env.JWT_SECRET).toBe('test-jwt-secret-16');
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

  it('defaults LOCAL_UPLOAD_DIR', () => {
    const env = validateEnv(validEnv);
    expect(env.LOCAL_UPLOAD_DIR).toBe('./uploads');
  });
});
