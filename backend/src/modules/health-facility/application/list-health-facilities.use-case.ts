import { Inject, Injectable } from '@nestjs/common';
import type {
  HealthFacilityLevel,
  HealthFacilityStatus,
} from '../domain/health-facility';
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
    type?: string;
    status?: HealthFacilityStatus;
    level?: HealthFacilityLevel;
    search?: string;
  }) {
    return this.facilities.list(query);
  }
}
