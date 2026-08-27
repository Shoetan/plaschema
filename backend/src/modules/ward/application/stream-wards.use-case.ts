import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import type { Ward } from '../domain/ward';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class StreamWardsUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  execute(input: {
    updatedSince?: string;
    batchSize?: number;
  }): AsyncGenerator<Ward[], void, unknown> {
    let updatedSince: Date | undefined;
    if (input.updatedSince) {
      updatedSince = new Date(input.updatedSince);
      if (Number.isNaN(updatedSince.getTime())) {
        throw new AppError(
          'VALIDATION_ERROR',
          'updatedSince must be a valid ISO datetime',
          400,
        );
      }
    }

    return this.wards.stream({
      batchSize: input.batchSize ?? 200,
      updatedSince,
    });
  }
}
