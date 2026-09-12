import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { HealthFacilityModule } from '../health-facility/health-facility.module';
import { IdentityModule } from '../identity/identity.module';
import { WardModule } from '../ward/ward.module';
import { CreateHouseholdEnrollmentUseCase } from './application/create-household-enrollment.use-case';
import { GetHouseholdCodeCountersUseCase } from './application/get-household-code-counters.use-case';
import { GetHouseholdUseCase } from './application/get-household.use-case';
import { ListHouseholdsUseCase } from './application/list-households.use-case';
import { HOUSEHOLD_REPOSITORY } from './application/household.repository';
import { PrismaHouseholdRepository } from './infrastructure/prisma-household.repository';
import { HouseholdController } from './presentation/household.controller';
import { HouseholdEnrollmentController } from './presentation/household-enrollment.controller';

@Module({
  imports: [
    ActivityLogModule,
    EnrollmentModule,
    HealthFacilityModule,
    IdentityModule,
    WardModule,
  ],
  controllers: [HouseholdController, HouseholdEnrollmentController],
  providers: [
    {
      provide: HOUSEHOLD_REPOSITORY,
      useClass: PrismaHouseholdRepository,
    },
    CreateHouseholdEnrollmentUseCase,
    ListHouseholdsUseCase,
    GetHouseholdCodeCountersUseCase,
    GetHouseholdUseCase,
  ],
})
export class HouseholdModule {}
