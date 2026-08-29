import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SWAGGER_ENABLED: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .default(true)
    .transform((value) => value === true || value === 'true'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_ADMIN_NAME: z.string().min(1).optional(),
  OBJECT_STORAGE_PROVIDER: z.enum(['railway']).default('railway'),
  OBJECT_STORAGE_BUCKET_NAME: z
    .string()
    .min(1, 'OBJECT_STORAGE_BUCKET_NAME is required'),
  OBJECT_STORAGE_ENDPOINT: z
    .string()
    .url('OBJECT_STORAGE_ENDPOINT must be a valid URL'),
  OBJECT_STORAGE_ACCESS_KEY_ID: z
    .string()
    .min(1, 'OBJECT_STORAGE_ACCESS_KEY_ID is required'),
  OBJECT_STORAGE_SECRET_ACCESS_KEY: z
    .string()
    .min(1, 'OBJECT_STORAGE_SECRET_ACCESS_KEY is required'),
  OBJECT_STORAGE_REGION: z.string().min(1).default('auto'),
  /** Presigned URL TTL in seconds (default 30 minutes). */
  OBJECT_STORAGE_PRESIGN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(1800),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  return result.data;
}
