import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppConfigService } from '../platform/config/app-config.service';

export async function startApplication(
  app: NestExpressApplication,
): Promise<void> {
  const config = app.get(AppConfigService);
  const logger = app.get(Logger);

  await app.listen(config.port);

  logger.log(
    {
      port: config.port,
      env: config.nodeEnv,
      swaggerEnabled: config.swaggerEnabled,
    },
    'Plaschema Application started',
  );
}
