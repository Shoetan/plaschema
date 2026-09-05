import { Module } from '@nestjs/common';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { DASHBOARD_REPOSITORY } from './application/dashboard.repository';
import { GetDashboardUseCase } from './application/get-dashboard.use-case';
import { PrismaDashboardRepository } from './infrastructure/prisma-dashboard.repository';
import { DashboardController } from './presentation/dashboard.controller';

@Module({
  imports: [ActivityLogModule],
  controllers: [DashboardController],
  providers: [
    { provide: DASHBOARD_REPOSITORY, useClass: PrismaDashboardRepository },
    GetDashboardUseCase,
  ],
})
export class DashboardModule {}
