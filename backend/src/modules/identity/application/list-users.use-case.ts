import { Inject, Injectable } from '@nestjs/common';
import type { UserRole, UserStatus } from '../domain/user';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(query: {
    page: number;
    pageSize: number;
    role?: UserRole;
    status?: UserStatus;
  }) {
    return this.users.list(query);
  }
}
