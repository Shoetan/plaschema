import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../config/app-config.service';
import { AppError } from '../http/app-error';
import { PrismaService } from '../persistence/prisma.service';
import type { AuthenticatedUser } from './current-user.decorator';

type JwtPayload = {
  sub: string;
  email: string;
  role: 'admin' | 'field_worker';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid access token', 401);
    }

    if (user.status !== 'active') {
      throw new AppError('UNAUTHORIZED', 'User account is inactive', 401);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
    };
  }
}
