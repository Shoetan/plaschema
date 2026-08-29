import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { HealthFacilityModule } from '../health-facility/health-facility.module';
import { IdentityModule } from '../identity/identity.module';
import { WardModule } from '../ward/ward.module';
import { CheckEnrollmentDuplicateUseCase } from './application/check-enrollment-duplicate.use-case';
import { CreateEnrollmentUseCase } from './application/create-enrollment.use-case';
import { ENROLLMENT_REPOSITORY } from './application/enrollment.repository';
import { AttachEnrollmentFileUrls } from './application/attach-enrollment-file-urls';
import { DevUploadEnrollmentFileUseCase } from './application/dev-upload-enrollment-file.use-case';
import { GenerateIdCardsUseCase } from './application/generate-id-cards.use-case';
import { GetEnrollmentUseCase } from './application/get-enrollment.use-case';
import { GetIdCardJobStatusUseCase } from './application/get-id-card-job-status.use-case';
import {
  ID_CARD_QUEUE_NAME,
  ID_CARD_QUEUE_PORT,
} from './application/id-card-queue.port';
import { ListEnrollmentsUseCase } from './application/list-enrollments.use-case';
import { PresignEnrollmentUploadUseCase } from './application/presign-enrollment-upload.use-case';
import {
  BullIdCardQueueAdapter,
  IdCardGenerationProcessor,
} from './infrastructure/id-card-job.processor';
import { IdCardPdfRenderer } from './infrastructure/id-card-pdf-renderer';
import { PrismaEnrollmentRepository } from './infrastructure/prisma-enrollment.repository';
import { EnrollmentController } from './presentation/enrollment.controller';

@Module({
  imports: [
    IdentityModule,
    WardModule,
    HealthFacilityModule,
    BullModule.registerQueue({ name: ID_CARD_QUEUE_NAME }),
  ],
  controllers: [EnrollmentController],
  providers: [
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: PrismaEnrollmentRepository,
    },
    {
      provide: ID_CARD_QUEUE_PORT,
      useClass: BullIdCardQueueAdapter,
    },
    CreateEnrollmentUseCase,
    PresignEnrollmentUploadUseCase,
    DevUploadEnrollmentFileUseCase,
    AttachEnrollmentFileUrls,
    ListEnrollmentsUseCase,
    GetEnrollmentUseCase,
    CheckEnrollmentDuplicateUseCase,
    GenerateIdCardsUseCase,
    GetIdCardJobStatusUseCase,
    IdCardPdfRenderer,
    IdCardGenerationProcessor,
  ],
  exports: [ENROLLMENT_REPOSITORY],
})
export class EnrollmentModule {}
