import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { normalizePlaceName } from '../../../shared/text';
import {
  WARD_REPOSITORY,
  type WardRepository,
} from '../../ward/application/ward.repository';
import {
  DEFAULT_HEALTH_FACILITY_LEVEL,
  DEFAULT_HEALTH_FACILITY_TYPE,
  type HealthFacilityLevel,
  type HealthFacilityStatus,
} from '../domain/health-facility';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from './health-facility.repository';

@Injectable()
export class CreateHealthFacilityUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(input: {
    name: string;
    wardId: string;
    /** Optional; defaults to the ward's LGA. */
    lga?: string;
    type?: string;
    level?: HealthFacilityLevel;
    status?: HealthFacilityStatus;
  }) {
    const name = normalizePlaceName(input.name);

    const ward = await this.wards.findById(input.wardId);
    if (!ward) {
      throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
    }

    const existing = await this.facilities.findByNameAndWard(
      name,
      input.wardId,
    );
    if (existing) {
      throw new AppError(
        'HEALTH_FACILITY_EXISTS',
        'A health facility with this name already exists in the ward',
        409,
      );
    }

    const lga = normalizePlaceName(input.lga ?? ward.lga);
    const type = (input.type?.trim() || DEFAULT_HEALTH_FACILITY_TYPE).trim();

    return this.facilities.create({
      id: createUuidV7(),
      name,
      lga,
      type,
      level: input.level ?? DEFAULT_HEALTH_FACILITY_LEVEL,
      status: input.status ?? 'active',
      wardId: input.wardId,
    });
  }
}
