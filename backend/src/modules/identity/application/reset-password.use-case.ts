import { Inject, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AppError } from '../../../platform/http/app-error';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string, newPassword: string) {
    const existing = await this.users.findById(userId);
    if (!existing) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    await this.users.update(userId, {
      passwordHash: await hash(newPassword, 12),
    });

    return { id: userId, passwordReset: true };
  }
}
