import { Inject, Injectable } from '@nestjs/common';
import type { UserRole, UserStatus } from '../domain/user';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(query: {
    cursor?: string;
    limit: number;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }) {
    return this.users.list(query);
  }
}
