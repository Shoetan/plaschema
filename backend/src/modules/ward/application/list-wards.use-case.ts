import { Inject, Injectable } from '@nestjs/common';
import { WARD_REPOSITORY, type WardRepository } from './ward.repository';

@Injectable()
export class ListWardsUseCase {
  constructor(
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
  ) {}

  async execute(query: { cursor?: string; limit: number }) {
    return this.wards.list(query);
  }
}
