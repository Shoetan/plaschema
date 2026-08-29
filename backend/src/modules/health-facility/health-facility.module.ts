import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { WardModule } from '../ward/ward.module';
import { BatchCreateHealthFacilitiesUseCase } from './application/batch-create-health-facilities.use-case';
import { CreateHealthFacilityUseCase } from './application/create-health-facility.use-case';
import { DeleteHealthFacilityUseCase } from './application/delete-health-facility.use-case';
import { GetHealthFacilityDetailUseCase } from './application/get-health-facility-detail.use-case';
import { GetHealthFacilityUseCase } from './application/get-health-facility.use-case';
import { HEALTH_FACILITY_REPOSITORY } from './application/health-facility.repository';
import { ListHealthFacilitiesUseCase } from './application/list-health-facilities.use-case';
import { StreamHealthFacilitiesUseCase } from './application/stream-health-facilities.use-case';
import { UpdateHealthFacilityUseCase } from './application/update-health-facility.use-case';
import { PrismaHealthFacilityRepository } from './infrastructure/prisma-health-facility.repository';
import { HealthFacilityController } from './presentation/health-facility.controller';

@Module({
  imports: [ActivityLogModule, WardModule],
  controllers: [HealthFacilityController],
  providers: [
    {
      provide: HEALTH_FACILITY_REPOSITORY,
      useClass: PrismaHealthFacilityRepository,
    },
    CreateHealthFacilityUseCase,
    BatchCreateHealthFacilitiesUseCase,
    ListHealthFacilitiesUseCase,
    StreamHealthFacilitiesUseCase,
    GetHealthFacilityUseCase,
    GetHealthFacilityDetailUseCase,
    UpdateHealthFacilityUseCase,
    DeleteHealthFacilityUseCase,
  ],
  exports: [HEALTH_FACILITY_REPOSITORY],
})
export class HealthFacilityModule {}
