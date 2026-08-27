import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/composition/app.module';

describe('Health endpoints (e2e)', () => {
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

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200 without depending on infrastructure', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200);
  });

  it('GET /health/ready reports dependency status', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('status');
    expect(
      response.body.info !== undefined || response.body.error !== undefined,
    ).toBe(true);
  });
});
