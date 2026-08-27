import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { successResponse } from './api-response';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ url?: string }>();
    const path = request.url?.split('?')[0] ?? '';

    return next.handle().pipe(
      map((body) => {
        if (path.startsWith('/health')) {
          return body;
        }

        if (body instanceof StreamableFile) {
          return body;
        }

        if (
          body &&
          typeof body === 'object' &&
          'success' in body &&
          typeof (body as { success: unknown }).success === 'boolean'
        ) {
          return body;
        }

        if (
          body &&
          typeof body === 'object' &&
          'data' in body &&
          'meta' in body
        ) {
          const wrapped = body as { data: unknown; meta: unknown };
          return successResponse(wrapped.data, (wrapped.meta as never) ?? null);
        }

        return successResponse(body ?? null);
      }),
    );
  }
}
