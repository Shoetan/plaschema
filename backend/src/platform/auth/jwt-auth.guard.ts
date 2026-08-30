import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AppError } from '../http/app-error';
import { hasBearerToken, resolveJwtAuthError } from './jwt-auth-errors';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (user) {
      return user;
    }

    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: string };
    }>();

    const resolved = resolveJwtAuthError({
      err,
      info,
      hasBearerToken: hasBearerToken(request.headers?.authorization),
    });

    if (resolved) {
      throw resolved;
    }

    if (err) {
      throw err;
    }

    throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
  }
}
