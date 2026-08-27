import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { normalizePlaceName } from '../../../shared/text';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class UpdateWardUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(id: string, input: { name?: string; lga?: string }) {
    const existing = await this.wards.findById(id);
    if (!existing) {
      throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
    }

    const name =
      input.name !== undefined ? normalizePlaceName(input.name) : undefined;
    const lga =
      input.lga !== undefined ? normalizePlaceName(input.lga) : undefined;

    if (name && name !== existing.name) {
      const clash = await this.wards.findByName(name);
      if (clash) {
        throw new AppError(
          'WARD_NAME_TAKEN',
          'A ward with this name already exists',
          409,
        );
      }
    }

    return this.wards.update(id, { name, lga });
  }
}
