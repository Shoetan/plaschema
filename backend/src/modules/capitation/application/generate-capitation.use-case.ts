import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppConfigService } from '../../../platform/config/app-config.service';
import type { CapitationGenerateResult } from '../domain/capitation';
import {
  CAPITATION_REPOSITORY,
  type CapitationRepository,
} from './capitation.repository';

@Injectable()
export class GenerateCapitationUseCase {
  constructor(
    @Inject(CAPITATION_REPOSITORY)
    private readonly capitation: CapitationRepository,
    private readonly config: AppConfigService,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: { month: number; year: number; rate?: number },
  ): Promise<CapitationGenerateResult> {
    const rate = input.rate ?? this.config.capitationRate;
    const records = await this.capitation.computeRecords(rate);

    return this.capitation.createRun({
      month: input.month,
      year: input.year,
      rate,
      createdByUserId: actor.id,
      records,
    });
  }
}
