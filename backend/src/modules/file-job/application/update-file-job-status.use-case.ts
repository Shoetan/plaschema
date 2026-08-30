import { Inject, Injectable } from '@nestjs/common';
import {
  FILE_JOB_REPOSITORY,
  type FileJobRepository,
} from './file-job.repository';

@Injectable()
export class MarkFileJobProcessingUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
  ) {}

  execute(id: string) {
    return this.fileJobs.markProcessing(id);
  }
}

@Injectable()
export class CompleteFileJobUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
  ) {}

  execute(
    id: string,
    input: {
      objectKey: string;
      metadata?: Parameters<FileJobRepository['markCompleted']>[1]['metadata'];
    },
  ) {
    return this.fileJobs.markCompleted(id, input);
  }
}

@Injectable()
export class FailFileJobUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
  ) {}

  execute(id: string, error: string) {
    return this.fileJobs.markFailed(id, error);
  }
}
