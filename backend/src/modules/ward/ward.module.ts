import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { IdentityModule } from '../identity/identity.module';
import { AssignWardFieldWorkersUseCase } from './application/assign-ward-field-workers.use-case';
import { BatchCreateWardsUseCase } from './application/batch-create-wards.use-case';
import { CreateWardUseCase } from './application/create-ward.use-case';
import { DeleteWardUseCase } from './application/delete-ward.use-case';
import { GetWardDetailUseCase } from './application/get-ward-detail.use-case';
import { GetWardUseCase } from './application/get-ward.use-case';
import { ListWardsUseCase } from './application/list-wards.use-case';
import { StreamWardsUseCase } from './application/stream-wards.use-case';
import { UpdateWardUseCase } from './application/update-ward.use-case';
import { WARD_REPOSITORY } from './application/ward.repository';
import { PrismaWardRepository } from './infrastructure/prisma-ward.repository';
import { WardController } from './presentation/ward.controller';

@Module({
  imports: [ActivityLogModule, IdentityModule],
  controllers: [WardController],
  providers: [
    { provide: WARD_REPOSITORY, useClass: PrismaWardRepository },
    CreateWardUseCase,
    BatchCreateWardsUseCase,
    ListWardsUseCase,
    StreamWardsUseCase,
    GetWardUseCase,
    GetWardDetailUseCase,
    AssignWardFieldWorkersUseCase,
    UpdateWardUseCase,
    DeleteWardUseCase,
  ],
  exports: [WARD_REPOSITORY],
})
export class WardModule {}
