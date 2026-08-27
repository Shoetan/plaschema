import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { toPublicUser } from '../domain/user';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(id: string) {
    const user = await this.users.findById(id);
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    }
    return toPublicUser(user);
  }
}
