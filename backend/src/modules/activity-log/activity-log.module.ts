import { Module } from '@nestjs/common';
import { ACTIVITY_LOG_REPOSITORY } from './application/activity-log.repository';
import { RecordActivityUseCase } from './application/record-activity.use-case';
import { PrismaActivityLogRepository } from './infrastructure/prisma-activity-log.repository';

@Module({
  providers: [
    {
      provide: ACTIVITY_LOG_REPOSITORY,
      useClass: PrismaActivityLogRepository,
    },
    RecordActivityUseCase,
  ],
  exports: [ACTIVITY_LOG_REPOSITORY, RecordActivityUseCase],
})
export class ActivityLogModule {}
