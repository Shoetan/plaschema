import { Inject, Injectable } from '@nestjs/common';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { buildFileJobTitle } from '../domain/file-job-title';
import type { FileJobFormat, FileJobKind, FileJobMetadata } from '../domain/file-job';
import {
  FILE_JOB_REPOSITORY,
  type FileJobRepository,
} from './file-job.repository';

@Injectable()
export class CreateFileJobUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
  ) {}

  async execute(input: {
    requestedByUserId: string;
    kind: FileJobKind;
    format: FileJobFormat;
    enrollmentCount?: number;
    metadata?: FileJobMetadata;
  }) {
    const createdAt = new Date();
    const id = createUuidV7();
    const title = buildFileJobTitle({
      kind: input.kind,
      format: input.format,
      enrollmentCount: input.enrollmentCount,
      createdAt,
    });

    const job = await this.fileJobs.create({
      id,
      requestedByUserId: input.requestedByUserId,
      kind: input.kind,
      format: input.format,
      title,
      metadata: input.metadata,
    });

    return job;
  }
}
