import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  const validEnv: Record<string, unknown> = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'postgresql://plaschema:plaschema@localhost:5432/plaschema',
    REDIS_URL: 'redis://localhost:6379',
    LOG_LEVEL: 'info',
    CORS_ORIGIN: 'http://localhost:5173',
    SWAGGER_ENABLED: 'true',
  };

  it('accepts a valid configuration', () => {
    const env = validateEnv(validEnv);

    expect(env.PORT).toBe(3000);
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('rejects missing DATABASE_URL', () => {
    const withoutDatabase: Record<string, unknown> = {
      NODE_ENV: 'test',
      PORT: '3000',
      REDIS_URL: 'redis://localhost:6379',
      LOG_LEVEL: 'info',
      CORS_ORIGIN: 'http://localhost:5173',
      SWAGGER_ENABLED: 'true',
    };

    expect(() => validateEnv(withoutDatabase)).toThrow(/DATABASE_URL/);
  });
});
