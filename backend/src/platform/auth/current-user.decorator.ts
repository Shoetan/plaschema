import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: 'admin' | 'field_worker';
  name: string;
  status: 'active' | 'inactive';
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
