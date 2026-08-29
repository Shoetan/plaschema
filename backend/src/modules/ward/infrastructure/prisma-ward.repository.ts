import { Injectable } from '@nestjs/common';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import { WARD_STATE, type Ward, type WardDetailAggregates, type WardListItem } from '../domain/ward';
import {
  lastNMonthsInLagos,
  monthKeyInLagos,
  startOfMonthInLagos,
  startOfTodayInLagos,
} from '../domain/ward-date';
import type {
  CreateWardInput,
  ListWardsQuery,
  PaginatedWards,
  StreamWardsQuery,
  UpdateWardInput,
  WardRepository,
} from '../application/ward.repository';

@Injectable()
export class PrismaWardRepository implements WardRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateWardInput): Promise<Ward> {
    return this.prisma.ward.create({ data: input });
  }

  async createMany(inputs: CreateWardInput[]): Promise<number> {
    if (inputs.length === 0) {
      return 0;
    }
    const result = await this.prisma.ward.createMany({
      data: inputs,
      skipDuplicates: true,
    });
    return result.count;
  }

  findById(id: string): Promise<Ward | null> {
    return this.prisma.ward.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Ward | null> {
    return this.prisma.ward.findUnique({ where: { name } });
  }

  findByNames(names: string[]): Promise<Ward[]> {
    if (names.length === 0) {
      return Promise.resolve([]);
    }
    return this.prisma.ward.findMany({
      where: { name: { in: names } },
    });
  }

  async list(query: ListWardsQuery): Promise<PaginatedWards> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });
    const where = {
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lga: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.ward.findMany({
      where,
      take: limit + 1,
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: {
            assignments: {
              where: { user: { role: 'field_worker' } },
            },
            enrollments: true,
          },
        },
      },
    });

    const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
    const wardIds = pageRows.map((row) => row.id);
    const todayStart = startOfTodayInLagos();

    const newEnrollmentGroups =
      wardIds.length === 0
        ? []
        : await this.prisma.enrollment.groupBy({
            by: ['wardId'],
            where: {
              wardId: { in: wardIds },
              createdAt: { gte: todayStart },
            },
            _count: { _all: true },
          });

    const newEnrollmentsByWard = new Map(
      newEnrollmentGroups.map((group) => [group.wardId, group._count._all]),
    );

    const items: WardListItem[] = pageRows.map((row) => ({
      id: row.id,
      name: row.name,
      state: WARD_STATE,
      lga: row.lga,
      fieldWorkers: row._count.assignments,
      beneficiaries: row._count.enrollments,
      newEnrollments: newEnrollmentsByWard.get(row.id) ?? 0,
      status: row.status,
    }));

    const hasMore = rows.length > limit;
    const last = items[items.length - 1];

    return {
      items,
      nextCursor: hasMore && last ? last.id : null,
      hasMore,
      limit,
    };
  }

  async *stream(
    query: StreamWardsQuery,
  ): AsyncGenerator<Ward[], void, unknown> {
    let cursor: string | undefined;
    const batchSize = toQueryInt(query.batchSize, 200, { min: 1, max: 500 });

    for (;;) {
      const rows = await this.prisma.ward.findMany({
        take: batchSize,
        where: {
          ...(cursor ? { id: { gt: cursor } } : {}),
          ...(query.updatedSince
            ? { updatedAt: { gte: query.updatedSince } }
            : {}),
        },
        orderBy: { id: 'asc' },
      });

      if (rows.length === 0) {
        return;
      }

      yield rows;
      cursor = rows[rows.length - 1]?.id;
      if (rows.length < batchSize || !cursor) {
        return;
      }
    }
  }

  update(id: string, input: UpdateWardInput): Promise<Ward> {
    return this.prisma.ward.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ward.delete({ where: { id } });
  }

  countAssignments(wardId: string): Promise<number> {
    return this.prisma.userWardAssignment.count({ where: { wardId } });
  }

  countHealthFacilities(wardId: string): Promise<number> {
    return this.prisma.healthFacility.count({ where: { wardId } });
  }

  async findDetailAggregates(wardId: string): Promise<WardDetailAggregates> {
    const trendMonths = lastNMonthsInLagos(12);
    const trendStart = trendMonths[0]?.start ?? startOfMonthInLagos();
    const monthStart = startOfMonthInLagos();

    const [
      totalBeneficiaries,
      activeFieldWorkers,
      enrollmentsThisMonth,
      latestEnrollment,
      trendRows,
      fieldWorkerAssignments,
      facilities,
    ] = await Promise.all([
      this.prisma.enrollment.count({ where: { wardId } }),
      this.prisma.userWardAssignment.count({
        where: {
          wardId,
          user: { role: 'field_worker', status: 'active' },
        },
      }),
      this.prisma.enrollment.count({
        where: { wardId, createdAt: { gte: monthStart } },
      }),
      this.prisma.enrollment.findFirst({
        where: { wardId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.enrollment.findMany({
        where: { wardId, createdAt: { gte: trendStart } },
        select: { createdAt: true },
      }),
      this.prisma.userWardAssignment.findMany({
        where: {
          wardId,
          user: { role: 'field_worker' },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
              lastSyncedAt: true,
            },
          },
        },
        orderBy: { user: { name: 'asc' } },
      }),
      this.prisma.healthFacility.findMany({
        where: { wardId },
        include: {
          ward: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const countsByMonth = new Map<string, number>();
    for (const row of trendRows) {
      const key = monthKeyInLagos(row.createdAt);
      countsByMonth.set(key, (countsByMonth.get(key) ?? 0) + 1);
    }

    const enrollmentTrend = trendMonths.map(({ month, label }) => ({
      month,
      label,
      count: countsByMonth.get(month) ?? 0,
    }));

    const fieldWorkerIds = fieldWorkerAssignments.map(
      (assignment) => assignment.userId,
    );
    const statsByUser = await this.loadFieldWorkerStats(wardId, fieldWorkerIds);

    return {
      stats: {
        totalBeneficiaries,
        activeFieldWorkers,
        enrollmentsThisMonth,
        lastActivityAt: latestEnrollment?.createdAt ?? null,
      },
      enrollmentTrend,
      fieldWorkers: this.mapFieldWorkerAssignments(
        fieldWorkerAssignments,
        statsByUser,
      ),
      healthFacilities: facilities.map((facility) => ({
        id: facility.id,
        name: facility.name,
        type: facility.type,
        level: facility.level,
        ward: facility.ward,
        beneficiaries: facility._count.enrollments,
        status: facility.status,
      })),
    };
  }

  async assignFieldWorkers(
    wardId: string,
    fieldWorkerIds: string[],
  ): Promise<{ addedUserIds: string[] }> {
    const previous = await this.prisma.userWardAssignment.findMany({
      where: { wardId, user: { role: 'field_worker' } },
      select: { userId: true },
    });
    const previousIds = new Set(previous.map((row) => row.userId));

    await this.prisma.$transaction(async (tx) => {
      await tx.userWardAssignment.deleteMany({
        where: { wardId, user: { role: 'field_worker' } },
      });

      if (fieldWorkerIds.length > 0) {
        await tx.userWardAssignment.createMany({
          data: fieldWorkerIds.map((userId) => ({ userId, wardId })),
        });
      }
    });

    const addedUserIds = fieldWorkerIds.filter((id) => !previousIds.has(id));

    return { addedUserIds };
  }

  private async loadFieldWorkersForWard(
    wardId: string,
  ): Promise<WardDetailAggregates['fieldWorkers']> {
    const fieldWorkerAssignments = await this.prisma.userWardAssignment.findMany(
      {
        where: {
          wardId,
          user: { role: 'field_worker' },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              status: true,
              lastSyncedAt: true,
            },
          },
        },
        orderBy: { user: { name: 'asc' } },
      },
    );

    const fieldWorkerIds = fieldWorkerAssignments.map(
      (assignment) => assignment.userId,
    );
    const statsByUser = await this.loadFieldWorkerStats(wardId, fieldWorkerIds);

    return this.mapFieldWorkerAssignments(fieldWorkerAssignments, statsByUser);
  }

  private async loadFieldWorkerStats(
    wardId: string,
    fieldWorkerIds: string[],
  ) {
    const enrollmentStats =
      fieldWorkerIds.length === 0
        ? []
        : await this.prisma.enrollment.groupBy({
            by: ['enrolledByUserId'],
            where: {
              wardId,
              enrolledByUserId: { in: fieldWorkerIds },
            },
            _count: { _all: true },
            _max: { createdAt: true },
          });

    return new Map(
      enrollmentStats.map((stat) => [
        stat.enrolledByUserId,
        {
          enrolled: stat._count._all,
          lastEnrollmentAt: stat._max.createdAt,
        },
      ]),
    );
  }

  private mapFieldWorkerAssignments(
    fieldWorkerAssignments: Array<{
      userId: string;
      user: {
        id: string;
        name: string;
        phone: string | null;
        status: 'active' | 'inactive';
        lastSyncedAt: Date | null;
      };
    }>,
    statsByUser: Map<
      string,
      { enrolled: number; lastEnrollmentAt: Date | null }
    >,
  ): WardDetailAggregates['fieldWorkers'] {
    return fieldWorkerAssignments.map((assignment) => {
      const workerStats = statsByUser.get(assignment.userId);
      return {
        id: assignment.user.id,
        name: assignment.user.name,
        phone: assignment.user.phone,
        enrolled: workerStats?.enrolled ?? 0,
        lastEnrollmentAt: workerStats?.lastEnrollmentAt ?? null,
        lastSyncedAt: assignment.user.lastSyncedAt,
        status: assignment.user.status,
      };
    });
  }
}
