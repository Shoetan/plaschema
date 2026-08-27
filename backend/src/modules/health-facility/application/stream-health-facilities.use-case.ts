import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import type { HealthFacility } from '../domain/health-facility';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from './health-facility.repository';

@Injectable()
export class StreamHealthFacilitiesUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
  ) {}

  execute(input: {
    updatedSince?: string;
    wardId?: string;
    batchSize?: number;
  }): AsyncGenerator<HealthFacility[], void, unknown> {
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

    return this.facilities.stream({
      batchSize: input.batchSize ?? 200,
      updatedSince,
      wardId: input.wardId,
    });
  }
}
