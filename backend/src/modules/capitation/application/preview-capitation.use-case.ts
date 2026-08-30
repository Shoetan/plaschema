import { Inject, Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../platform/config/app-config.service';
import type { CapitationPreviewResult } from '../domain/capitation';
import {
  CAPITATION_REPOSITORY,
  type CapitationRepository,
} from './capitation.repository';

@Injectable()
export class PreviewCapitationUseCase {
  constructor(
    @Inject(CAPITATION_REPOSITORY)
    private readonly capitation: CapitationRepository,
    private readonly config: AppConfigService,
  ) {}

  execute(input: {
    month: number;
    year: number;
    rate?: number;
  }): Promise<CapitationPreviewResult> {
    const rate = input.rate ?? this.config.capitationRate;
    return this.capitation.preview(input.month, input.year, rate);
  }
}
