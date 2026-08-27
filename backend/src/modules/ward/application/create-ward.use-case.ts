import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { normalizePlaceName } from '../../../shared/text';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class CreateWardUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(input: { name: string; lga: string }) {
    const name = normalizePlaceName(input.name);
    const lga = normalizePlaceName(input.lga);

    const existing = await this.wards.findByName(name);
    if (existing) {
      throw new AppError(
        'WARD_NAME_TAKEN',
        'A ward with this name already exists',
        409,
      );
    }

    return this.wards.create({
      id: createUuidV7(),
      name,
      lga,
    });
  }
}
