import { Module } from '@nestjs/common';
import { HealthFacilityModule } from '../health-facility/health-facility.module';
import { IdentityModule } from '../identity/identity.module';
import { WardModule } from '../ward/ward.module';
import { CheckEnrollmentDuplicateUseCase } from './application/check-enrollment-duplicate.use-case';
import { CreateEnrollmentUseCase } from './application/create-enrollment.use-case';
import { ENROLLMENT_REPOSITORY } from './application/enrollment.repository';
import { GetEnrollmentFileUseCase } from './application/get-enrollment-file.use-case';
import { GetEnrollmentUseCase } from './application/get-enrollment.use-case';
import { ListEnrollmentsUseCase } from './application/list-enrollments.use-case';
import { UploadEnrollmentFileUseCase } from './application/upload-enrollment-file.use-case';
import { PrismaEnrollmentRepository } from './infrastructure/prisma-enrollment.repository';
import { EnrollmentController } from './presentation/enrollment.controller';

@Module({
  imports: [IdentityModule, WardModule, HealthFacilityModule],
  controllers: [EnrollmentController],
  providers: [
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
    CreateEnrollmentUseCase,
    UploadEnrollmentFileUseCase,
    ListEnrollmentsUseCase,
    GetEnrollmentUseCase,
    CheckEnrollmentDuplicateUseCase,
    GetEnrollmentFileUseCase,
  ],
  exports: [ENROLLMENT_REPOSITORY],
})
export class EnrollmentModule {}
