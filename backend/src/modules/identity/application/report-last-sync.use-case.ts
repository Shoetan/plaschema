import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class ReportLastSyncUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(userId: string) {
    const existing = await this.users.findById(userId);
    if (!existing) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }

    return this.users.update(userId, {
      lastSyncedAt: new Date(),
    });
  }
}
