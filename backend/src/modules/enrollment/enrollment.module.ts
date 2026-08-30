import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { FileJobModule } from '../file-job/file-job.module';
import { HealthFacilityModule } from '../health-facility/health-facility.module';
import { IdentityModule } from '../identity/identity.module';
import { WardModule } from '../ward/ward.module';
import { CheckEnrollmentDuplicateUseCase } from './application/check-enrollment-duplicate.use-case';
import { CreateEnrollmentUseCase } from './application/create-enrollment.use-case';
import { ENROLLMENT_REPOSITORY } from './application/enrollment.repository';
import { AttachEnrollmentFileUrls } from './application/attach-enrollment-file-urls';
import { DevUploadEnrollmentFileUseCase } from './application/dev-upload-enrollment-file.use-case';
import { ExportEnrollmentReportUseCase } from './application/export-enrollment-report.use-case';
import { GenerateIdCardsUseCase } from './application/generate-id-cards.use-case';
import { GetEnrollmentDetailUseCase } from './application/get-enrollment-detail.use-case';
import { GetEnrollmentUseCase } from './application/get-enrollment.use-case';
import {
  ENROLLMENT_EXPORT_QUEUE_NAME,
  ENROLLMENT_EXPORT_QUEUE_PORT,
} from './application/enrollment-export-queue.port';
import {
  ID_CARD_QUEUE_NAME,
  ID_CARD_QUEUE_PORT,
} from './application/id-card-queue.port';
import { ListEnrollmentsUseCase } from './application/list-enrollments.use-case';
import { PresignEnrollmentUploadUseCase } from './application/presign-enrollment-upload.use-case';
import { ResolveEnrollmentListFiltersUseCase } from './application/resolve-enrollment-list-filters';
import {
  BullEnrollmentExportQueueAdapter,
  EnrollmentExportProcessor,
} from './infrastructure/enrollment-export-job.processor';
import {
  BullIdCardQueueAdapter,
  IdCardGenerationProcessor,
} from './infrastructure/id-card-job.processor';
import { EnrollmentReportXlsxRenderer } from './infrastructure/enrollment-report-xlsx';
import { IdCardPdfRenderer } from './infrastructure/id-card-pdf-renderer';
import { PrismaEnrollmentRepository } from './infrastructure/prisma-enrollment.repository';
import { EnrollmentController } from './presentation/enrollment.controller';

@Module({
  imports: [
    ActivityLogModule,
    FileJobModule,
    IdentityModule,
    WardModule,
    HealthFacilityModule,
    BullModule.registerQueue({ name: ID_CARD_QUEUE_NAME }),
    BullModule.registerQueue({ name: ENROLLMENT_EXPORT_QUEUE_NAME }),
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
    {
      provide: ENROLLMENT_EXPORT_QUEUE_PORT,
      useClass: BullEnrollmentExportQueueAdapter,
    },
    CreateEnrollmentUseCase,
    PresignEnrollmentUploadUseCase,
    DevUploadEnrollmentFileUseCase,
    AttachEnrollmentFileUrls,
    ResolveEnrollmentListFiltersUseCase,
    ListEnrollmentsUseCase,
    GetEnrollmentUseCase,
    GetEnrollmentDetailUseCase,
    CheckEnrollmentDuplicateUseCase,
    GenerateIdCardsUseCase,
    ExportEnrollmentReportUseCase,
    IdCardPdfRenderer,
    IdCardGenerationProcessor,
    EnrollmentReportXlsxRenderer,
    EnrollmentExportProcessor,
  ],
  exports: [ENROLLMENT_REPOSITORY],
})
export class EnrollmentModule {}
