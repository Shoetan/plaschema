import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { normalizePlaceName } from '../../../shared/text';
import {
  WARD_REPOSITORY,
  type WardRepository,
} from '../../ward/application/ward.repository';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from './health-facility.repository';

@Injectable()
export class UpdateHealthFacilityUseCase {
  constructor(
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(
    id: string,
    input: { name?: string; lga?: string; wardId?: string },
  ) {
    const existing = await this.facilities.findById(id);
    if (!existing) {
      throw new AppError(
        'HEALTH_FACILITY_NOT_FOUND',
        'Health facility not found',
        404,
      );
    }

    const nextWardId = input.wardId ?? existing.wardId;
    const nextName =
      input.name !== undefined
        ? normalizePlaceName(input.name)
        : existing.name;
    const nextLga =
      input.lga !== undefined ? normalizePlaceName(input.lga) : undefined;

    if (input.wardId) {
      const ward = await this.wards.findById(input.wardId);
      if (!ward) {
        throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
      }
    }

    if (nextName !== existing.name || nextWardId !== existing.wardId) {
      const clash = await this.facilities.findByNameAndWard(
        nextName,
        nextWardId,
      );
      if (clash && clash.id !== id) {
        throw new AppError(
          'HEALTH_FACILITY_EXISTS',
          'A health facility with this name already exists in the ward',
          409,
        );
      }
    }

    return this.facilities.update(id, {
      name: input.name !== undefined ? nextName : undefined,
      lga: nextLga,
      wardId: input.wardId,
    });
  }
}
