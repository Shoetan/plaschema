import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import {
  FILE_JOB_REPOSITORY,
  type FileJobRepository,
} from './file-job.repository';
import { buildFileJobDownloadFilename } from '../domain/file-job-download-filename';

@Injectable()
export class GetFileJobDownloadUrlUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(actor: AuthenticatedUser, id: string) {
    const job = await this.fileJobs.findByIdForUser(id, actor.id);
    if (!job) {
      throw new AppError('FILE_JOB_NOT_FOUND', 'File job not found', 404);
    }

    if (job.status !== 'completed' || !job.objectKey) {
      throw new AppError(
        'FILE_JOB_NOT_READY',
        'File is not ready for download',
        409,
      );
    }

    const filename = buildFileJobDownloadFilename(job.title, job.format);
    const read = await this.storage.createReadUrl(job.objectKey, {
      downloadFilename: filename,
    });
    return {
      jobId: job.id,
      downloadUrl: read.readUrl,
      expiresInSeconds: read.expiresInSeconds,
      title: job.title,
      filename: read.downloadFilename ?? filename,
      format: job.format,
    };
  }
}
