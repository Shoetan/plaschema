import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AppError } from '../../../platform/http/app-error';
import { toTitleCase } from '../../../shared/text';
import { assertUserRoleConstraints, type UserStatus } from '../domain/user';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(
    id: string,
    input: {
      name?: string;
      phone?: string | null;
      status?: UserStatus;
      password?: string;
      assignedWardIds?: string[];
    },
  ) {
    const existing = await this.users.findById(id);
    if (!existing) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    const nextPhone = input.phone !== undefined ? input.phone : existing.phone;
    const nextWardIds =
      input.assignedWardIds !== undefined
        ? input.assignedWardIds
        : existing.assignedWards.map((ward) => ward.id);

    try {
      assertUserRoleConstraints({
        role: existing.role,
        phone: nextPhone,
        assignedWardIds: nextWardIds,
      });
    } catch {
      throw new AppError(
        'VALIDATION_ERROR',
        'Phone is required for field workers',
        400,
      );
    }

    if (existing.role === 'admin' && input.assignedWardIds !== undefined) {
      // Admins do not keep ward assignments.
    }

    const assignedWardIds =
      existing.role === 'field_worker'
        ? (input.assignedWardIds ?? nextWardIds)
        : [];

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

    return this.users.update(id, {
      name: input.name !== undefined ? toTitleCase(input.name) : undefined,
      phone:
        input.phone === undefined ? undefined : input.phone?.trim() || null,
      status: input.status,
      passwordHash: input.password ? await hash(input.password, 12) : undefined,
      assignedWardIds:
        existing.role === 'field_worker'
          ? assignedWardIds
          : input.assignedWardIds !== undefined
            ? []
            : undefined,
    });
  }
}
