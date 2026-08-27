import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from './health-facility.repository';

@Injectable()
export class GetHealthFacilityUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
  ) {}

  async execute(id: string) {
    const facility = await this.facilities.findById(id);
    if (!facility) {
      throw new AppError(
        'HEALTH_FACILITY_NOT_FOUND',
        'Health facility not found',
        404,
      );
    }
    return facility;
  }
}
