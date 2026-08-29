import { Module } from '@nestjs/common';
import { HealthFacilityModule } from '../health-facility/health-facility.module';
import { IdentityModule } from '../identity/identity.module';
import { WardModule } from '../ward/ward.module';
import { CheckEnrollmentDuplicateUseCase } from './application/check-enrollment-duplicate.use-case';
import { CreateEnrollmentUseCase } from './application/create-enrollment.use-case';
import { ENROLLMENT_REPOSITORY } from './application/enrollment.repository';
import { AttachEnrollmentFileUrls } from './application/attach-enrollment-file-urls';
import { DevUploadEnrollmentFileUseCase } from './application/dev-upload-enrollment-file.use-case';
import { GetEnrollmentUseCase } from './application/get-enrollment.use-case';
import { ListEnrollmentsUseCase } from './application/list-enrollments.use-case';
import { PresignEnrollmentUploadUseCase } from './application/presign-enrollment-upload.use-case';
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
    PresignEnrollmentUploadUseCase,
    DevUploadEnrollmentFileUseCase,
    AttachEnrollmentFileUrls,
    ListEnrollmentsUseCase,
    GetEnrollmentUseCase,
    CheckEnrollmentDuplicateUseCase,
  ],
  exports: [ENROLLMENT_REPOSITORY],
})
export class EnrollmentModule {}
