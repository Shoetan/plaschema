import type { ActivityLogEntry } from '../domain/activity-log';

export const ACTIVITY_LOG_REPOSITORY = Symbol('ACTIVITY_LOG_REPOSITORY');

export type RecordActivityInput = {
  id: string;
  category: ActivityLogEntry['category'];
  action: ActivityLogEntry['action'];
  summary: string;
  wardId: string;
  actorUserId?: string | null;
  enrollmentId?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: Date;
};

export type ActivityLogRecentFilters = {
  wardId?: string;
  lga?: string;
  occurredFrom?: Date;
  occurredTo?: Date;
};

export type ActivityLogEntryWithWard = ActivityLogEntry & {
  ward: { id: string; name: string };
};

export interface ActivityLogRepository {
  record(input: RecordActivityInput): Promise<ActivityLogEntry>;
  findRecentByWard(wardId: string, limit: number): Promise<ActivityLogEntry[]>;
  findLatestByWard(wardId: string): Promise<ActivityLogEntry | null>;
  findRecentByActor(actorUserId: string, limit: number): Promise<ActivityLogEntry[]>;
  findRecentByHealthFacility(
    healthFacilityId: string,
    limit: number,
  ): Promise<ActivityLogEntry[]>;
  findLatestByHealthFacility(
    healthFacilityId: string,
  ): Promise<ActivityLogEntry | null>;
  findRecentByEnrollment(
    enrollmentId: string,
    limit: number,
  ): Promise<ActivityLogEntry[]>;
  findRecent(
    filters: ActivityLogRecentFilters,
    limit: number,
  ): Promise<ActivityLogEntryWithWard[]>;
}
