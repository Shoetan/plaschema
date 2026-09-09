import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { normalizePlaceName } from '../../../shared/text';
import type { WardStatus } from '../domain/ward';
import { deriveWardCodeBase, resolveUniqueWardCode } from '../domain/ward-code';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class CreateWardUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(input: {
    name: string;
    lga: string;
    status?: WardStatus;
  }) {
    const name = normalizePlaceName(input.name);
    const lga = normalizePlaceName(input.lga);

    try {
      deriveWardCodeBase(lga, name);
    } catch {
      throw new AppError(
        'VALIDATION_ERROR',
        'Ward LGA and name must each contain at least one letter',
        400,
      );
    }

    const existing = await this.wards.findByName(name);
    if (existing) {
      throw new AppError(
        'WARD_NAME_TAKEN',
        'A ward with this name already exists',
        409,
      );
    }

    const code = await resolveUniqueWardCode(lga, name, async (candidate) => {
      const existingCode = await this.wards.findByCode(candidate);
      return existingCode !== null;
    });

    return this.wards.create({
      id: createUuidV7(),
      code,
      name,
      lga,
      status: input.status ?? 'active',
    });
  }
}
