import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppConfigService } from '../config/app-config.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly config: AppConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse &&
            typeof exceptionResponse === 'object' &&
            'message' in exceptionResponse
          ? (exceptionResponse as { message: string | string[] }).message
          : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      error:
        exception instanceof HttpException
          ? exception.name
          : 'InternalServerError',
      ...(this.config.isProduction
        ? {}
        : {
            details:
              exception instanceof Error
                ? exception.message
                : String(exception),
          }),
    });
  }
}
