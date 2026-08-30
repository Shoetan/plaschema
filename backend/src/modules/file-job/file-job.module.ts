import { Module } from '@nestjs/common';
import { FILE_JOB_REPOSITORY } from './application/file-job.repository';
import { CreateFileJobUseCase } from './application/create-file-job.use-case';
import { GetFileJobDownloadUrlUseCase } from './application/get-file-job-download-url.use-case';
import {
  GetFileJobUseCase,
  ListFileJobsUseCase,
} from './application/list-file-jobs.use-case';
import {
  CompleteFileJobUseCase,
  FailFileJobUseCase,
  MarkFileJobProcessingUseCase,
} from './application/update-file-job-status.use-case';
import { PrismaFileJobRepository } from './infrastructure/prisma-file-job.repository';
import { FileJobController } from './presentation/file-job.controller';

@Module({
  controllers: [FileJobController],
  providers: [
    {
      provide: FILE_JOB_REPOSITORY,
      useClass: PrismaFileJobRepository,
    },
    CreateFileJobUseCase,
    MarkFileJobProcessingUseCase,
    CompleteFileJobUseCase,
    FailFileJobUseCase,
    ListFileJobsUseCase,
    GetFileJobUseCase,
    GetFileJobDownloadUrlUseCase,
  ],
  exports: [
    CreateFileJobUseCase,
    MarkFileJobProcessingUseCase,
    CompleteFileJobUseCase,
    FailFileJobUseCase,
    FILE_JOB_REPOSITORY,
  ],
})
export class FileJobModule {}
