import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class GetWardUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(id: string) {
    const ward = await this.wards.findById(id);
    if (!ward) {
      throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
    }
    return ward;
  }
}
