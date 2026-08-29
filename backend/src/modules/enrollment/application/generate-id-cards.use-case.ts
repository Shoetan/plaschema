import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from './enrollment.repository';
import {
  ID_CARD_QUEUE_PORT,
  type IdCardJobPayload,
  type IdCardQueuePort,
} from './id-card-queue.port';

const MAX_CARDS_PER_SHEET = 9;

@Injectable()
export class GenerateIdCardsUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(ID_CARD_QUEUE_PORT) private readonly queue: IdCardQueuePort,
  ) {}

  async execute(input: {
    enrollmentIds: string[];
    requestedByUserId: string;
  }): Promise<{ jobId: string; status: 'queued' }> {
    const uniqueIds = [...new Set(input.enrollmentIds)];

    if (uniqueIds.length < 1 || uniqueIds.length > MAX_CARDS_PER_SHEET) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Select between 1 and ${MAX_CARDS_PER_SHEET} beneficiaries`,
        400,
      );
    }

    if (uniqueIds.length !== input.enrollmentIds.length) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Duplicate enrollment IDs are not allowed',
        400,
      );
    }

    const found = await this.enrollments.findManyByIds(uniqueIds);
    if (found.length !== uniqueIds.length) {
      throw new AppError(
        'ENROLLMENT_NOT_FOUND',
        'One or more enrollments were not found',
        404,
      );
    }

    const payload: IdCardJobPayload = {
      enrollmentIds: uniqueIds,
      requestedByUserId: input.requestedByUserId,
    };

    const jobId = await this.queue.enqueue(payload);
    return { jobId, status: 'queued' };
  }
}
