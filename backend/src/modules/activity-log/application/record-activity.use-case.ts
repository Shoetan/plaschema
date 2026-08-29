import { Inject, Injectable } from '@nestjs/common';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import type { ActivityLogEntry } from '../domain/activity-log';
import {
  ACTIVITY_LOG_REPOSITORY,
  type ActivityLogRepository,
  type RecordActivityInput,
} from './activity-log.repository';

@Injectable()
export class RecordActivityUseCase {
  constructor(
    @Inject(ACTIVITY_LOG_REPOSITORY)
    private readonly activityLogs: ActivityLogRepository,
  ) {}

  execute(
    input: Omit<RecordActivityInput, 'id'> & { id?: string },
  ): Promise<ActivityLogEntry> {
    return this.activityLogs.record({
      ...input,
      id: input.id ?? createUuidV7(),
    });
  }
}
