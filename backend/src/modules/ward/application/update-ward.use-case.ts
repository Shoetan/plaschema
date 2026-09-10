import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { normalizePlaceName } from '../../../shared/text';
import type { WardStatus } from '../domain/ward';
import { deriveWardCodeBase, resolveUniqueWardCode } from '../domain/ward-code';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class UpdateWardUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(
    id: string,
    input: { name?: string; lga?: string; status?: WardStatus },
  ) {
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

    const nextName = name ?? existing.name;
    const nextLga = lga ?? existing.lga;
    const shouldRecode =
      (name !== undefined || lga !== undefined) &&
      (nextName !== existing.name || nextLga !== existing.lga);

    let code: string | undefined;
    if (shouldRecode) {
      try {
        deriveWardCodeBase(nextLga, nextName);
      } catch {
        throw new AppError(
          'VALIDATION_ERROR',
          'Ward LGA and name must each contain at least one letter',
          400,
        );
      }

      code = await resolveUniqueWardCode(nextLga, nextName, async (candidate) => {
        const existingCode = await this.wards.findByCode(candidate);
        return existingCode !== null && existingCode.id !== id;
      });
    }

    return this.wards.update(id, {
      code,
      name,
      lga,
      status: input.status,
    });
  }
}
