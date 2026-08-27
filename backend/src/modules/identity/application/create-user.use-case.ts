import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AppError } from '../../../platform/http/app-error';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { toTitleCase } from '../../../shared/text';
import {
  assertUserRoleConstraints,
  type UserRole,
  type UserStatus,
} from '../domain/user';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string | null;
    assignedWardIds?: string[];
    status?: UserStatus;
  }) {
    try {
      assertUserRoleConstraints({
        role: input.role,
        phone: input.phone,
        assignedWardIds: input.assignedWardIds,
      });
    } catch {
      throw new AppError(
        'VALIDATION_ERROR',
        'Phone is required for field workers',
        400,
      );
    }

    const email = input.email.toLowerCase().trim();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new AppError(
        'EMAIL_TAKEN',
        'A user with this email already exists',
        409,
      );
    }

    const assignedWardIds =
      input.role === 'field_worker' ? (input.assignedWardIds ?? []) : [];

    if (assignedWardIds.length > 0) {
      const ok = await this.users.wardIdsExist(assignedWardIds);
      if (!ok) {
        throw new AppError(
          'WARD_NOT_FOUND',
          'One or more assigned wards do not exist',
          400,
        );
      }
    }

    const passwordHash = await hash(input.password, 12);

    return this.users.create({
      id: createUuidV7(),
      name: toTitleCase(input.name),
      email,
      passwordHash,
      role: input.role,
      status: input.status ?? 'active',
      phone:
        input.role === 'admin'
          ? input.phone?.trim() || null
          : input.phone!.trim(),
      assignedWardIds,
    });
  }
}
