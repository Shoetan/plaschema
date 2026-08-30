import { Module, forwardRef } from '@nestjs/common';
import { HealthFacilityModule } from '../health-facility/health-facility.module';
import { CAPITATION_REPOSITORY } from './application/capitation.repository';
import { GenerateCapitationUseCase } from './application/generate-capitation.use-case';
import { ListCapitationsUseCase } from './application/list-capitations.use-case';
import { PreviewCapitationUseCase } from './application/preview-capitation.use-case';
import { PrismaCapitationRepository } from './infrastructure/prisma-capitation.repository';
import { CapitationController } from './presentation/capitation.controller';

@Module({
  imports: [forwardRef(() => HealthFacilityModule)],
  controllers: [CapitationController],
  providers: [
    {
      provide: CAPITATION_REPOSITORY,
      useClass: PrismaCapitationRepository,
    },
    PreviewCapitationUseCase,
    GenerateCapitationUseCase,
    ListCapitationsUseCase,
  ],
  exports: [CAPITATION_REPOSITORY],
})
export class CapitationModule {}
