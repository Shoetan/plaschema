import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import {
  ID_CARD_QUEUE_PORT,
  type IdCardQueuePort,
} from './id-card-queue.port';

@Injectable()
export class GetIdCardJobStatusUseCase {
  constructor(
    @Inject(ID_CARD_QUEUE_PORT) private readonly queue: IdCardQueuePort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
  ) {}

  async execute(jobId: string): Promise<{
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    expiresInSeconds?: number;
    error?: string;
  }> {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      throw new AppError('ID_CARD_JOB_NOT_FOUND', 'ID card job not found', 404);
    }

    if (job.state === 'completed') {
      if (!job.returnvalue?.objectKey) {
        return {
          jobId,
          status: 'failed',
          error: 'Job completed without a PDF object key',
        };
      }

      const read = await this.storage.createReadUrl(job.returnvalue.objectKey);
      return {
        jobId,
        status: 'completed',
        downloadUrl: read.readUrl,
        expiresInSeconds: read.expiresInSeconds,
      };
    }

    if (job.state === 'failed') {
      return {
        jobId,
        status: 'failed',
        error: job.failedReason || 'ID card generation failed',
      };
    }

    if (job.state === 'active') {
      return { jobId, status: 'processing' };
    }

    return { jobId, status: 'queued' };
  }
}
