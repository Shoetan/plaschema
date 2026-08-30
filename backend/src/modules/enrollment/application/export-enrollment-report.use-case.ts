import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { CreateFileJobUseCase } from '../../file-job/application/create-file-job.use-case';
import {
  ENROLLMENT_EXPORT_QUEUE_PORT,
  type EnrollmentExportJobPayload,
  type EnrollmentExportQueuePort,
  type EnrollmentReportFormat,
} from './enrollment-export-queue.port';
import {
  ResolveEnrollmentListFiltersUseCase,
  type EnrollmentListFilterInput,
} from './resolve-enrollment-list-filters';

const SUPPORTED_FORMATS: EnrollmentReportFormat[] = ['xlsx'];

@Injectable()
export class ExportEnrollmentReportUseCase {
  constructor(
    private readonly resolveFilters: ResolveEnrollmentListFiltersUseCase,
    @Inject(ENROLLMENT_EXPORT_QUEUE_PORT)
    private readonly queue: EnrollmentExportQueuePort,
    private readonly createFileJob: CreateFileJobUseCase,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: EnrollmentListFilterInput & { format: EnrollmentReportFormat },
  ): Promise<{ jobId: string; status: 'queued' }> {
    if (!SUPPORTED_FORMATS.includes(input.format)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Only xlsx export is supported currently',
        400,
      );
    }

    if (
      input.ageMin != null &&
      input.ageMax != null &&
      input.ageMin > input.ageMax
    ) {
      throw new AppError(
        'VALIDATION_ERROR',
        'ageMin cannot be greater than ageMax',
        400,
      );
    }

    const filters = await this.resolveFilters.execute(actor, input);

    const fileJob = await this.createFileJob.execute({
      requestedByUserId: actor.id,
      kind: 'enrollment_report',
      format: input.format,
    });

    const payload: EnrollmentExportJobPayload = {
      format: input.format,
      filters,
      requestedByUserId: actor.id,
    };

    await this.queue.enqueue(payload, fileJob.id);
    return { jobId: fileJob.id, status: 'queued' };
  }
}
