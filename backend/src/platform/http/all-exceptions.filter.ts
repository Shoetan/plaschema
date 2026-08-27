import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AppConfigService } from '../config/app-config.service';
import { AppError } from './app-error';
import type { ApiErrorResponse } from './api-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly config: AppConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const payload = this.toErrorResponse(exception);

    response.status(payload.statusCode).json(payload.body);
  }

  private toErrorResponse(exception: unknown): {
    statusCode: number;
    body: ApiErrorResponse;
  } {
    if (exception instanceof AppError) {
      return {
        statusCode: exception.statusCode,
        body: {
          success: false,
          error: {
            code: exception.code,
            message: exception.message,
            details: exception.details,
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const { message, details } = this.extractHttpMessage(exceptionResponse);

      return {
        statusCode,
        body: {
          success: false,
          error: {
            code: this.codeForHttpStatus(statusCode),
            message: Array.isArray(message) ? message.join('; ') : message,
            details: details ?? (Array.isArray(message) ? message : null),
          },
        },
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          details: this.config.isProduction
            ? null
            : exception instanceof Error
              ? exception.message
              : String(exception),
        },
      },
    };
  }

  private extractHttpMessage(exceptionResponse: string | object): {
    message: string | string[];
    details: unknown;
  } {
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse, details: null };
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message: string | string[] })
        .message;
      return {
        message,
        details:
          'error' in exceptionResponse
            ? (exceptionResponse as { error: unknown }).error
            : null,
      };
    }

    return { message: 'Request failed', details: null };
  }

  private codeForHttpStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'HTTP_ERROR';
    }
  }
}
