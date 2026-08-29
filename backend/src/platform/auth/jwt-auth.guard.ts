import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { AppError } from '../http/app-error';
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

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err) {
      // Preserve intentional auth failures; do not mask infrastructure errors
      // (e.g. Prisma schema drift) as "Authentication required".
      if (err instanceof AppError) {
        throw err;
      }
      throw err;
    }

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    return user;
  }
}
