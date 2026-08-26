import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppConfigService } from '../platform/config/app-config.service';
import { AllExceptionsFilter } from '../platform/http/all-exceptions.filter';
import { configureSwagger } from './configure-swagger';

export async function configureApplication(
  app: NestExpressApplication,
): Promise<void> {
  const config = app.get(AppConfigService);

  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors({
    origin: parseCorsOrigin(config.corsOrigin),
  });

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
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(config));
  configureSwagger(app);
}

function parseCorsOrigin(corsOrigin: string): boolean | string | string[] {
  if (corsOrigin.trim() === '*') {
    return true;
  }

  const origins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0] : origins;
}
