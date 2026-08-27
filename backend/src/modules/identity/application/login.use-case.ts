import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { AppConfigService } from '../../../platform/config/app-config.service';
import { AppError } from '../../../platform/http/app-error';
import { toPublicUser } from '../domain/user';
import { USER_REPOSITORY, type UserRepository } from './user.repository';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  async execute(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401,
      );
    }

    const valid = await compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401,
      );
    }

    if (user.status !== 'active') {
      throw new AppError('UNAUTHORIZED', 'User account is inactive', 401);
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.jwtExpiresIn,
      user: toPublicUser(user),
    };
  }
}
