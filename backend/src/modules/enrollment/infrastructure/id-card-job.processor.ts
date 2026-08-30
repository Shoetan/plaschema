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
  ID_CARD_QUEUE_NAME,
  type IdCardJobPayload,
  type IdCardJobResult,
  type IdCardQueuePort,
} from '../application/id-card-queue.port';
import { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import {
  CompleteFileJobUseCase,
  FailFileJobUseCase,
  MarkFileJobProcessingUseCase,
} from '../../file-job/application/update-file-job-status.use-case';
import {
  enrollmentFullName,
  type IdCardRenderInput,
} from './id-card-html';
import { IdCardPdfRenderer } from './id-card-pdf-renderer';

@Injectable()
export class BullIdCardQueueAdapter implements IdCardQueuePort {
  constructor(
    @InjectQueue(ID_CARD_QUEUE_NAME)
    private readonly queue: Queue<IdCardJobPayload, IdCardJobResult>,
  ) {}

  async enqueue(payload: IdCardJobPayload, jobId: string): Promise<string> {
    const job = await this.queue.add('generate', payload, {
      jobId,
      removeOnComplete: { age: 60 * 60 * 24, count: 200 },
      removeOnFail: { age: 60 * 60 * 24 * 7 },
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
    });
    return String(job.id);
  }
}

@Processor(ID_CARD_QUEUE_NAME, { concurrency: 1 })
export class IdCardGenerationProcessor
  extends WorkerHost
  implements OnModuleInit
{
  private readonly logger = new Logger(IdCardGenerationProcessor.name);

  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly pdfRenderer: IdCardPdfRenderer,
    private readonly recordActivity: RecordActivityUseCase,
    private readonly markFileJobProcessing: MarkFileJobProcessingUseCase,
    private readonly completeFileJob: CompleteFileJobUseCase,
    private readonly failFileJob: FailFileJobUseCase,
  ) {
    super();
  }

  onModuleInit() {
    this.logger.log('ID card generation worker ready (concurrency=1)');
  }

  async process(
    job: Job<IdCardJobPayload, IdCardJobResult>,
  ): Promise<IdCardJobResult> {
    const { enrollmentIds } = job.data;
    const jobId = String(job.id);
    this.logger.log(
      `Generating ID cards for ${enrollmentIds.length} enrollments (job ${jobId})`,
    );

    await this.markFileJobProcessing.execute(jobId);

    try {
      const rows = await this.enrollments.findManyByIds(enrollmentIds);
      if (rows.length !== enrollmentIds.length) {
        throw new Error('One or more enrollments were not found');
      }

      const cards: IdCardRenderInput[] = await Promise.all(
        rows.map(async (row) => {
          let passport: Buffer | null = null;
          try {
            const object = await this.storage.getObject(row.passportObjectKey);
            passport = object.body;
          } catch (error) {
            this.logger.warn(
              `Passport missing for ${row.enrollmentId}: ${
                error instanceof Error ? error.message : 'unknown'
              }`,
            );
          }

          return {
            enrollmentId: row.enrollmentId,
            fullName: enrollmentFullName(row),
            emergencyPhone: row.emergencyPhone,
            bloodGroup: row.bloodGroup,
            facilityName: row.facilityName,
            passport,
          };
        }),
      );

      const pdf = await this.pdfRenderer.renderSheet(cards);
      const objectKey = `id-cards/${jobId}.pdf`;
      await this.storage.putObject({
        objectKey,
        body: pdf,
        contentType: 'application/pdf',
      });

      const printedAt = new Date();
      await this.enrollments.markPrinted(enrollmentIds, printedAt);

      await Promise.all(
        rows.map((row) =>
          this.recordActivity.execute({
            category: 'enrollment',
            action: 'printed',
            summary: `ID card printed for ${enrollmentFullName(row)}`,
            wardId: row.wardId,
            actorUserId: job.data.requestedByUserId,
            enrollmentId: row.id,
            occurredAt: printedAt,
          }),
        ),
      );

      await this.completeFileJob.execute(jobId, {
        objectKey,
        metadata: { enrollmentCount: enrollmentIds.length, enrollmentIds },
      });

      return { objectKey, enrollmentIds };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'ID card generation failed';
      await this.failFileJob.execute(jobId, message);
      throw error;
    }
  }
}
