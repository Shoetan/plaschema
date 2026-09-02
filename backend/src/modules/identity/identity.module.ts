import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { CreateUserUseCase } from './application/create-user.use-case';
import { GetFieldWorkerDetailUseCase } from './application/get-field-worker-detail.use-case';
import { GetUserUseCase } from './application/get-user.use-case';
import { ListUsersUseCase } from './application/list-users.use-case';
import { LoginUseCase } from './application/login.use-case';
import { ReportLastSyncUseCase } from './application/report-last-sync.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { USER_REPOSITORY } from './application/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { AuthController } from './presentation/auth.controller';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [ActivityLogModule],
  controllers: [AuthController, UsersController],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    LoginUseCase,
    CreateUserUseCase,
    ListUsersUseCase,
    GetUserUseCase,
    GetFieldWorkerDetailUseCase,
    ReportLastSyncUseCase,
    UpdateUserUseCase,
    ResetPasswordUseCase,
  ],
  exports: [USER_REPOSITORY],
})
export class IdentityModule {}
