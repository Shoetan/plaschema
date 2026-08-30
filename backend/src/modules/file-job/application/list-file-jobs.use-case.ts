import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import type { FileJobStatus } from '../domain/file-job';
import {
  FILE_JOB_REPOSITORY,
  type FileJobRepository,
} from './file-job.repository';

@Injectable()
export class ListFileJobsUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
  ) {}

  execute(
    actor: AuthenticatedUser,
    query: { cursor?: string; limit: number; status?: FileJobStatus },
  ) {
    return this.fileJobs.list({
      requestedByUserId: actor.id,
      cursor: query.cursor,
      limit: query.limit,
      status: query.status,
    });
  }
}

@Injectable()
export class GetFileJobUseCase {
  constructor(
    @Inject(FILE_JOB_REPOSITORY)
    private readonly fileJobs: FileJobRepository,
  ) {}

  async execute(actor: AuthenticatedUser, id: string) {
    const job = await this.fileJobs.findByIdForUser(id, actor.id);
    if (!job) {
      return null;
    }

    return {
      ...job,
      canDownload: job.status === 'completed' && job.objectKey != null,
    };
  }
}
