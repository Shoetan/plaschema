import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type { ActivityLogEntry } from '../domain/activity-log';
import type {
  ActivityLogEntryWithWard,
  ActivityLogRecentFilters,
  ActivityLogRepository,
  RecordActivityInput,
} from '../application/activity-log.repository';

type ActivityLogRow = {
  id: string;
  category: ActivityLogEntry['category'];
  action: ActivityLogEntry['action'];
  summary: string;
  wardId: string;
  enrollmentId: string | null;
  occurredAt: Date;
  actor: { id: string; name: string } | null;
};

type ActivityLogRowWithWard = ActivityLogRow & {
  ward: { id: string; name: string };
};

@Injectable()
export class PrismaActivityLogRepository implements ActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: ActivityLogRow): ActivityLogEntry {
    return {
      id: row.id,
      category: row.category,
      action: row.action,
      summary: row.summary,
      wardId: row.wardId,
      actor: row.actor,
      enrollmentId: row.enrollmentId,
      occurredAt: row.occurredAt,
    };
  }

  private include = {
    actor: { select: { id: true, name: true } },
  } as const;

  async record(input: RecordActivityInput): Promise<ActivityLogEntry> {
    const row = await this.prisma.activityLog.create({
      data: {
        id: input.id,
        category: input.category,
        action: input.action,
        summary: input.summary,
        wardId: input.wardId,
        actorUserId: input.actorUserId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        occurredAt: input.occurredAt,
      },
      include: this.include,
    });

    return this.map(row as ActivityLogRow);
  }

  async findRecentByWard(
    wardId: string,
    limit: number,
  ): Promise<ActivityLogEntry[]> {
    const rows = await this.prisma.activityLog.findMany({
      where: { wardId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: this.include,
    });

    return rows.map((row) => this.map(row));
  }

  async findLatestByWard(wardId: string): Promise<ActivityLogEntry | null> {
    const row = await this.prisma.activityLog.findFirst({
      where: { wardId },
      orderBy: { occurredAt: 'desc' },
      include: this.include,
    });

    return row ? this.map(row) : null;
  }

  async findRecentByActor(
    actorUserId: string,
    limit: number,
  ): Promise<ActivityLogEntry[]> {
    const rows = await this.prisma.activityLog.findMany({
      where: { actorUserId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: this.include,
    });

    return rows.map((row) => this.map(row));
  }

  async findRecentByHealthFacility(
    healthFacilityId: string,
    limit: number,
  ): Promise<ActivityLogEntry[]> {
    const rows = await this.prisma.activityLog.findMany({
      where: { enrollment: { healthFacilityId } },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: this.include,
    });

    return rows.map((row) => this.map(row));
  }

  async findLatestByHealthFacility(
    healthFacilityId: string,
  ): Promise<ActivityLogEntry | null> {
    const row = await this.prisma.activityLog.findFirst({
      where: { enrollment: { healthFacilityId } },
      orderBy: { occurredAt: 'desc' },
      include: this.include,
    });

    return row ? this.map(row) : null;
  }

  async findRecentByEnrollment(
    enrollmentId: string,
    limit: number,
  ): Promise<ActivityLogEntry[]> {
    const rows = await this.prisma.activityLog.findMany({
      where: { enrollmentId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: this.include,
    });

    return rows.map((row) => this.map(row));
  }

  async findRecent(
    filters: ActivityLogRecentFilters,
    limit: number,
  ): Promise<ActivityLogEntryWithWard[]> {
    const rows = await this.prisma.activityLog.findMany({
      where: {
        ...(filters.wardId ? { wardId: filters.wardId } : {}),
        ...(filters.lga ? { ward: { lga: filters.lga } } : {}),
        ...(filters.occurredFrom || filters.occurredTo
          ? {
              occurredAt: {
                ...(filters.occurredFrom
                  ? { gte: filters.occurredFrom }
                  : {}),
                ...(filters.occurredTo ? { lte: filters.occurredTo } : {}),
              },
            }
          : {}),
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
      include: {
        actor: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true } },
      },
    });

    return rows.map((row) => {
      const mapped = row as ActivityLogRowWithWard;
      return {
        ...this.map(mapped),
        ward: mapped.ward,
      };
    });
  }
}
