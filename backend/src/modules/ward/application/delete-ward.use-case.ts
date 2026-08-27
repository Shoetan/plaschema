import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class DeleteWardUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(id: string) {
    const existing = await this.wards.findById(id);
    if (!existing) {
      throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
    }

    const assignments = await this.wards.countAssignments(id);
    if (assignments > 0) {
      throw new AppError(
        'WARD_IN_USE',
        'Cannot delete a ward assigned to field workers',
        409,
      );
    }

    const facilities = await this.wards.countHealthFacilities(id);
    if (facilities > 0) {
      throw new AppError(
        'WARD_IN_USE',
        'Cannot delete a ward that has health facilities',
        409,
      );
    }

    await this.wards.delete(id);
  }
}
