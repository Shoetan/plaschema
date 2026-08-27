import { Inject, Injectable } from '@nestjs/common';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from './health-facility.repository';

@Injectable()
export class ListHealthFacilitiesUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
  ) {}

  async execute(query: {
    cursor?: string;
    limit: number;
    wardId?: string;
    lga?: string;
  }) {
    return this.facilities.list(query);
  }
}
