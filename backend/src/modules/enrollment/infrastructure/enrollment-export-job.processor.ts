import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from '../application/enrollment.repository';
import {
  ENROLLMENT_EXPORT_QUEUE_NAME,
  type EnrollmentExportJobPayload,
  type EnrollmentExportJobResult,
  type EnrollmentExportQueuePort,
} from '../application/enrollment-export-queue.port';
import {
  CompleteFileJobUseCase,
  FailFileJobUseCase,
  MarkFileJobProcessingUseCase,
} from '../../file-job/application/update-file-job-status.use-case';
import { EnrollmentReportXlsxRenderer } from './enrollment-report-xlsx';

@Injectable()
export class BullEnrollmentExportQueueAdapter
  implements EnrollmentExportQueuePort
{
  constructor(
    @InjectQueue(ENROLLMENT_EXPORT_QUEUE_NAME)
    private readonly queue: Queue<
      EnrollmentExportJobPayload,
      EnrollmentExportJobResult
    >,
  ) {}

  async enqueue(payload: EnrollmentExportJobPayload, jobId: string): Promise<string> {
    const job = await this.queue.add('export', payload, {
      jobId,
      removeOnComplete: { age: 60 * 60 * 24, count: 200 },
      removeOnFail: { age: 60 * 60 * 24 * 7 },
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });
    return String(job.id);
  }
}

@Processor(ENROLLMENT_EXPORT_QUEUE_NAME, { concurrency: 1 })
export class EnrollmentExportProcessor
  extends WorkerHost
  implements OnModuleInit
{
  private readonly logger = new Logger(EnrollmentExportProcessor.name);

  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly xlsxRenderer: EnrollmentReportXlsxRenderer,
    private readonly markFileJobProcessing: MarkFileJobProcessingUseCase,
    private readonly completeFileJob: CompleteFileJobUseCase,
    private readonly failFileJob: FailFileJobUseCase,
  ) {
    super();
  }

  onModuleInit() {
    this.logger.log('Enrollment report export worker ready (concurrency=1)');
  }

  async process(
    job: Job<EnrollmentExportJobPayload, EnrollmentExportJobResult>,
  ): Promise<EnrollmentExportJobResult> {
    const { format, filters } = job.data;
    const jobId = String(job.id);
    this.logger.log(`Generating ${format} enrollment report (job ${jobId})`);

    if (format !== 'xlsx') {
      throw new Error(`Unsupported export format: ${format}`);
    }

    await this.markFileJobProcessing.execute(jobId);

    try {
      const { buffer, rowCount } = await this.xlsxRenderer.render(
        this.enrollments.iterateForExport(filters),
      );

      const objectKey = `enrollment-reports/${jobId}.xlsx`;
      await this.storage.putObject({
        objectKey,
        body: buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      await this.completeFileJob.execute(jobId, {
        objectKey,
        metadata: { rowCount },
      });

      this.logger.log(
        `Enrollment report export completed (job ${jobId}, rows=${rowCount})`,
      );

      return { objectKey, format, rowCount };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Enrollment export failed';
      await this.failFileJob.execute(jobId, message);
      throw error;
    }
  }
}
