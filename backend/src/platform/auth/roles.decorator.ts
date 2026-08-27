import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AppRole = 'admin' | 'field_worker';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
