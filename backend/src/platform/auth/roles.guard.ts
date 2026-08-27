import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppError } from '../http/app-error';
import type { AuthenticatedUser } from './current-user.decorator';
import { AppRole, ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const user = request.user;

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!requiredRoles.includes(user.role)) {
      throw new AppError(
        'FORBIDDEN',
        'You do not have permission to access this resource',
        403,
      );
    }

    return true;
  }
}
