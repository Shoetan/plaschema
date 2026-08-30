import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from '../../health-facility/application/health-facility.repository';
import { currentMonthYearInLagos } from '../../ward/domain/ward-date';
import {
  CAPITATION_REPOSITORY,
  type CapitationRepository,
} from './capitation.repository';

@Injectable()
export class ListCapitationsUseCase {
  constructor(
    @Inject(CAPITATION_REPOSITORY)
    private readonly capitation: CapitationRepository,
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
  ) {}

  async execute(query: {
    month?: number;
    year?: number;
    cursor?: string;
    limit: number;
    lga?: string;
    healthFacilityId?: string;
    search?: string;
  }) {
    const defaults = currentMonthYearInLagos();
    const month = query.month ?? defaults.month;
    const year = query.year ?? defaults.year;

    if (query.healthFacilityId) {
      const facility = await this.facilities.findById(query.healthFacilityId);
      if (!facility) {
        throw new AppError(
          'HEALTH_FACILITY_NOT_FOUND',
          'Health facility not found',
          404,
        );
      }
    }

    const result = await this.capitation.list({
      month,
      year,
      cursor: query.cursor,
      limit: query.limit,
      lga: query.lga,
      healthFacilityId: query.healthFacilityId,
      search: query.search,
    });

    return {
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: result.limit,
      },
      summary: result.summary,
    };
  }
}
