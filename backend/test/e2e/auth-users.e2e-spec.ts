import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/composition/app.module';
import { ResponseInterceptor } from '../../src/platform/http/response.interceptor';
import { AllExceptionsFilter } from '../../src/platform/http/all-exceptions.filter';
import { AppConfigService } from '../../src/platform/config/app-config.service';

describe('Auth and users (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.NODE_ENV ??= 'test';
    process.env.PORT ??= '3000';
    process.env.DATABASE_URL ??=
      'postgresql://plaschema:plaschema@localhost:5432/plaschema';
    process.env.REDIS_URL ??= 'redis://localhost:6379';
    process.env.LOG_LEVEL ??= 'silent';
    process.env.CORS_ORIGIN ??= 'http://localhost:5173';
    process.env.SWAGGER_ENABLED ??= 'false';
    process.env.JWT_SECRET ??= 'test-jwt-secret-16chars';
    process.env.JWT_EXPIRES_IN ??= '8h';
    process.env.OBJECT_STORAGE_PROVIDER ??= 'railway';
    process.env.OBJECT_STORAGE_BUCKET_NAME ??= 'test-bucket';
    process.env.OBJECT_STORAGE_ENDPOINT ??= 'https://t3.storageapi.dev';
    process.env.OBJECT_STORAGE_ACCESS_KEY_ID ??= 'test-access-key';
    process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY ??= 'test-secret-key';
    process.env.OBJECT_STORAGE_REGION ??= 'auto';
    process.env.OBJECT_STORAGE_PRESIGN_TTL_SECONDS ??= '1800';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    const config = app.get(AppConfigService);

    app.setGlobalPrefix('api', {
      exclude: [
        { path: 'health/live', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
      ],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter(config));
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in as seeded admin and creates another admin', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@cbhi.local',
        password: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!',
      });

    expect(login.status).toBe(200);
    expect(login.body.success).toBe(true);
    expect(login.body.data.accessToken).toBeDefined();

    const token = login.body.data.accessToken as string;
    const email = `admin.${Date.now()}@cbhi.local`;

    const created = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Second Admin',
        email,
        password: 'ChangeMe123!',
        role: 'admin',
      });

    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.email).toBe(email);
    expect(created.body.data.role).toBe('admin');
  });

  it('rejects unauthenticated user listing', async () => {
    const response = await request(app.getHttpServer()).get('/api/users');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
