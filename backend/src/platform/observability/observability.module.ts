import { Module, RequestMethod } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        // NestJS 11 / path-to-regexp require named wildcards (`*` is deprecated).
        forRoutes: [{ path: '{*path}', method: RequestMethod.ALL }],
        pinoHttp: {
          level: config.nodeEnv === 'test' ? 'silent' : config.logLevel,
          autoLogging: config.nodeEnv !== 'test',
          genReqId: (req: IncomingMessage) => {
            const header = req.headers['x-request-id'];
            if (typeof header === 'string' && header.length > 0) {
              return header;
            }
            return randomUUID();
          },
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'password',
              'token',
              '*.password',
              '*.token',
            ],
            censor: '[Redacted]',
          },
          transport: config.isDevelopment
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              }
            : undefined,
        },
      }),
    }),
  ],
})
export class ObservabilityModule {}
