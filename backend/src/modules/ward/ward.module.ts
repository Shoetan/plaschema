import { Module } from '@nestjs/common';
import { BatchCreateWardsUseCase } from './application/batch-create-wards.use-case';
import { CreateWardUseCase } from './application/create-ward.use-case';
import { DeleteWardUseCase } from './application/delete-ward.use-case';
import { GetWardUseCase } from './application/get-ward.use-case';
import { ListWardsUseCase } from './application/list-wards.use-case';
import { StreamWardsUseCase } from './application/stream-wards.use-case';
import { UpdateWardUseCase } from './application/update-ward.use-case';
import { WARD_REPOSITORY } from './application/ward.repository';
import { PrismaWardRepository } from './infrastructure/prisma-ward.repository';
import { WardController } from './presentation/ward.controller';

@Module({
  controllers: [WardController],
  providers: [
    { provide: WARD_REPOSITORY, useClass: PrismaWardRepository },
    CreateWardUseCase,
    BatchCreateWardsUseCase,
    ListWardsUseCase,
    StreamWardsUseCase,
    GetWardUseCase,
    UpdateWardUseCase,
    DeleteWardUseCase,
  ],
  exports: [WARD_REPOSITORY],
})
export class WardModule {}
