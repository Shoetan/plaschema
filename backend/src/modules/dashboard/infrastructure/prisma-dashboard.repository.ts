import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type { DashboardRepository } from '../application/dashboard.repository';
import {
  normalizeCategoryBreakdown,
  type DashboardOverview,
  type DashboardQuery,
} from '../domain/dashboard';
import {
  buildTrendBuckets,
  percentChange,
  trendBucketKeyForDate,
  type DashboardPeriodWindow,
} from '../domain/dashboard-period';

const TOP_WARDS = 10;
const TOP_FACILITIES = 5;
const TOP_WORKERS = 10;
const RECENT_ENROLLMENTS = 5;

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWardLga(wardId: string): Promise<string | null> {
    return this.prisma.ward
      .findUnique({ where: { id: wardId }, select: { lga: true } })
      .then((ward) => ward?.lga ?? null);
  }

  async loadOverview(
    query: DashboardQuery,
    window: DashboardPeriodWindow,
  ): Promise<Omit<DashboardOverview, 'filters' | 'recentActivity'>> {
    const geo = this.geoWhere(query);
    const periodCreated = {
      ...geo,
      createdAt: { gte: window.start, lte: window.end },
    };
    const previousCreated = {
      ...geo,
      createdAt: { gte: window.previousStart, lte: window.previousEnd },
    };

    const [
      totalEnrollments,
      activeBeneficiaries,
      inactiveBeneficiaries,
      newEnrollments,
      previousNewEnrollments,
      previousActiveCreated,
      previousInactiveCreated,
      previousTotalCreated,
      totalFacilities,
      activeFacilities,
      facilitiesCreatedInPeriod,
      facilitiesCreatedPrevious,
      fieldWorkerScopeStats,
      categoryRows,
      statusRows,
      wardGroups,
      lgaGroups,
      trendRows,
      topFacilityGroups,
      workerEnrollmentGroups,
      recentEnrollmentRows,
    ] = await Promise.all([
      this.prisma.enrollment.count({ where: geo }),
      this.prisma.enrollment.count({ where: { ...geo, status: 'active' } }),
      this.prisma.enrollment.count({ where: { ...geo, status: 'disabled' } }),
      this.prisma.enrollment.count({ where: periodCreated }),
      this.prisma.enrollment.count({ where: previousCreated }),
      this.prisma.enrollment.count({
        where: { ...previousCreated, status: 'active' },
      }),
      this.prisma.enrollment.count({
        where: { ...previousCreated, status: 'disabled' },
      }),
      this.prisma.enrollment.count({ where: previousCreated }),
      this.countFacilities(query, undefined),
      this.countFacilities(query, 'active'),
      this.countFacilitiesCreated(query, window.start, window.end),
      this.countFacilitiesCreated(
        query,
        window.previousStart,
        window.previousEnd,
      ),
      this.loadFieldWorkerScope(query, window),
      this.prisma.enrollment.groupBy({
        by: ['category'],
        where: periodCreated,
        _count: { _all: true },
      }),
      this.prisma.enrollment.groupBy({
        by: ['status'],
        where: periodCreated,
        _count: { _all: true },
      }),
      this.prisma.enrollment.groupBy({
        by: ['wardId'],
        where: periodCreated,
        _count: { _all: true },
        orderBy: { _count: { wardId: 'desc' } },
        take: TOP_WARDS,
      }),
      this.prisma.enrollment.groupBy({
        by: ['wardId'],
        where: periodCreated,
        _count: { _all: true },
      }),
      this.prisma.enrollment.findMany({
        where: periodCreated,
        select: { createdAt: true },
      }),
      this.prisma.enrollment.groupBy({
        by: ['healthFacilityId'],
        where: periodCreated,
        _count: { _all: true },
        orderBy: { _count: { healthFacilityId: 'desc' } },
        take: TOP_FACILITIES,
      }),
      this.prisma.enrollment.groupBy({
        by: ['enrolledByUserId'],
        where: periodCreated,
        _count: { _all: true },
        _max: { createdAt: true },
        orderBy: { _count: { enrolledByUserId: 'desc' } },
        take: TOP_WORKERS,
      }),
      this.prisma.enrollment.findMany({
        where: periodCreated,
        orderBy: { createdAt: 'desc' },
        take: RECENT_ENROLLMENTS,
        select: {
          id: true,
          enrollmentId: true,
          firstName: true,
          lastName: true,
          middleName: true,
          category: true,
          status: true,
          createdAt: true,
          ward: { select: { id: true, name: true, lga: true } },
          healthFacility: { select: { id: true, name: true } },
        },
      }),
    ]);

    const wardIds = [
      ...new Set([
        ...wardGroups.map((row) => row.wardId),
        ...lgaGroups.map((row) => row.wardId),
      ]),
    ];
    const wards =
      wardIds.length === 0
        ? []
        : await this.prisma.ward.findMany({
            where: { id: { in: wardIds } },
            select: { id: true, name: true, lga: true },
          });
    const wardById = new Map(wards.map((ward) => [ward.id, ward]));

    const enrollmentByWard = wardGroups.map((row) => {
      const ward = wardById.get(row.wardId);
      return {
        wardId: row.wardId,
        name: ward?.name ?? 'Unknown ward',
        count: row._count._all,
      };
    });

    const lgaTotals = new Map<string, number>();
    for (const row of lgaGroups) {
      const lga = wardById.get(row.wardId)?.lga;
      if (!lga) continue;
      lgaTotals.set(lga, (lgaTotals.get(lga) ?? 0) + row._count._all);
    }
    const enrollmentByLga = [...lgaTotals.entries()]
      .map(([lga, count]) => ({ lga, count }))
      .sort((a, b) => b.count - a.count);

    const buckets = buildTrendBuckets(query.trend, window.start, window.end);
    const countsByBucket = new Map<string, number>();
    for (const row of trendRows) {
      const key = trendBucketKeyForDate(query.trend, row.createdAt);
      countsByBucket.set(key, (countsByBucket.get(key) ?? 0) + 1);
    }
    const points = buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      count: countsByBucket.get(bucket.key) ?? 0,
    }));
    const trendTotal = points.reduce((sum, point) => sum + point.count, 0);
    const average =
      points.length === 0
        ? 0
        : Math.round((trendTotal / points.length) * 10) / 10;

    const facilityIds = topFacilityGroups.map((row) => row.healthFacilityId);
    const facilities =
      facilityIds.length === 0
        ? []
        : await this.prisma.healthFacility.findMany({
            where: { id: { in: facilityIds } },
            select: {
              id: true,
              name: true,
              lga: true,
              ward: { select: { id: true, name: true } },
            },
          });
    const facilityById = new Map(
      facilities.map((facility) => [facility.id, facility]),
    );
    const facilityItems = topFacilityGroups.map((row) => {
      const facility = facilityById.get(row.healthFacilityId);
      return {
        id: row.healthFacilityId,
        name: facility?.name ?? 'Unknown facility',
        lga: facility?.lga ?? '',
        ward: facility?.ward ?? { id: '', name: 'Unknown ward' },
        beneficiaries: row._count._all,
      };
    });
    const allFacilityBeneficiaryTotal = newEnrollments;

    const workerIds = workerEnrollmentGroups.map((row) => row.enrolledByUserId);
    const workers =
      workerIds.length === 0
        ? []
        : await this.prisma.user.findMany({
            where: { id: { in: workerIds }, role: 'field_worker' },
            select: { id: true, name: true, status: true },
          });
    const workerById = new Map(workers.map((worker) => [worker.id, worker]));
    const workerItems = workerEnrollmentGroups.map((row) => {
      const worker = workerById.get(row.enrolledByUserId);
      return {
        id: row.enrolledByUserId,
        name: worker?.name ?? 'Unknown worker',
        enrolled: row._count._all,
        lastActivityAt: row._max.createdAt,
        status: (worker?.status ?? 'inactive') as 'active' | 'inactive',
      };
    });

    const periodActive =
      statusRows.find((row) => row.status === 'active')?._count._all ?? 0;
    const periodInactive =
      statusRows.find((row) => row.status === 'disabled')?._count._all ?? 0;
    const statusDenom = periodActive + periodInactive;
    const activePercent =
      statusDenom === 0
        ? 0
        : Math.round((periodActive / statusDenom) * 1000) / 10;
    const inactivePercent =
      statusDenom === 0
        ? 0
        : Math.round((periodInactive / statusDenom) * 1000) / 10;

    const activeCreatedInPeriod =
      statusRows.find((row) => row.status === 'active')?._count._all ?? 0;
    const inactiveCreatedInPeriod =
      statusRows.find((row) => row.status === 'disabled')?._count._all ?? 0;

    return {
      kpis: {
        totalEnrollments: {
          value: totalEnrollments,
          changePercent: percentChange(newEnrollments, previousTotalCreated),
        },
        activeBeneficiaries: {
          value: activeBeneficiaries,
          changePercent: percentChange(
            activeCreatedInPeriod,
            previousActiveCreated,
          ),
        },
        inactiveBeneficiaries: {
          value: inactiveBeneficiaries,
          changePercent: percentChange(
            inactiveCreatedInPeriod,
            previousInactiveCreated,
          ),
        },
        newEnrollments: {
          value: newEnrollments,
          changePercent: percentChange(
            newEnrollments,
            previousNewEnrollments,
          ),
        },
        totalFacilities: {
          value: totalFacilities,
          changeAbsolute:
            facilitiesCreatedInPeriod - facilitiesCreatedPrevious,
        },
        fieldWorkers: {
          value: fieldWorkerScopeStats.total,
          changeAbsolute:
            fieldWorkerScopeStats.createdInPeriod -
            fieldWorkerScopeStats.createdPrevious,
        },
      },
      enrollmentTrend: {
        total: trendTotal,
        average,
        granularity: query.trend,
        points,
      },
      enrollmentByCategory: normalizeCategoryBreakdown(
        categoryRows.map((row) => ({
          category: row.category,
          count: row._count._all,
        })),
      ),
      enrollmentByStatus: {
        active: { count: periodActive, percent: activePercent },
        inactive: { count: periodInactive, percent: inactivePercent },
      },
      enrollmentByWard,
      enrollmentByLga,
      facilityOverview: {
        totalFacilities,
        activeFacilities,
        totalBeneficiaries: allFacilityBeneficiaryTotal,
        items: facilityItems,
      },
      fieldWorkerPerformance: {
        totalFieldWorkers: fieldWorkerScopeStats.total,
        activeFieldWorkers: fieldWorkerScopeStats.active,
        totalEnrolled: newEnrollments,
        averagePerWorker:
          fieldWorkerScopeStats.total === 0
            ? 0
            : Math.round(newEnrollments / fieldWorkerScopeStats.total),
        items: workerItems,
      },
      recentEnrollments: recentEnrollmentRows.map((row) => ({
        id: row.id,
        enrollmentId: row.enrollmentId,
        beneficiaryName: [row.firstName, row.middleName, row.lastName]
          .filter(Boolean)
          .join(' '),
        category: row.category,
        status: row.status,
        lga: row.ward.lga,
        ward: { id: row.ward.id, name: row.ward.name },
        facility: {
          id: row.healthFacility.id,
          name: row.healthFacility.name,
        },
        createdAt: row.createdAt,
      })),
    };
  }

  private geoWhere(query: DashboardQuery): Prisma.EnrollmentWhereInput {
    if (query.wardId) {
      return { wardId: query.wardId };
    }
    if (query.lga) {
      return { ward: { lga: query.lga } };
    }
    return {};
  }

  private facilityWhere(
    query: DashboardQuery,
    status?: 'active' | 'inactive',
  ): Prisma.HealthFacilityWhereInput {
    return {
      ...(status ? { status } : {}),
      ...(query.wardId ? { wardId: query.wardId } : {}),
      ...(query.lga && !query.wardId ? { lga: query.lga } : {}),
    };
  }

  private countFacilities(
    query: DashboardQuery,
    status?: 'active' | 'inactive',
  ): Promise<number> {
    return this.prisma.healthFacility.count({
      where: this.facilityWhere(query, status),
    });
  }

  private countFacilitiesCreated(
    query: DashboardQuery,
    from: Date,
    to: Date,
  ): Promise<number> {
    return this.prisma.healthFacility.count({
      where: {
        ...this.facilityWhere(query),
        createdAt: { gte: from, lte: to },
      },
    });
  }

  private async loadFieldWorkerScope(
    query: DashboardQuery,
    window: DashboardPeriodWindow,
  ): Promise<{
    total: number;
    active: number;
    createdInPeriod: number;
    createdPrevious: number;
  }> {
    const assignmentFilter: Prisma.UserWhereInput | undefined =
      query.wardId || query.lga
        ? {
            OR: [
              { assignedWards: { none: {} } },
              {
                assignedWards: {
                  some: {
                    ...(query.wardId ? { wardId: query.wardId } : {}),
                    ...(query.lga && !query.wardId
                      ? { ward: { lga: query.lga } }
                      : {}),
                  },
                },
              },
            ],
          }
        : undefined;

    const base: Prisma.UserWhereInput = {
      role: 'field_worker',
      ...assignmentFilter,
    };

    const [total, active, createdInPeriod, createdPrevious] =
      await Promise.all([
        this.prisma.user.count({ where: base }),
        this.prisma.user.count({ where: { ...base, status: 'active' } }),
        this.prisma.user.count({
          where: {
            ...base,
            createdAt: { gte: window.start, lte: window.end },
          },
        }),
        this.prisma.user.count({
          where: {
            ...base,
            createdAt: {
              gte: window.previousStart,
              lte: window.previousEnd,
            },
          },
        }),
      ]);

    return { total, active, createdInPeriod, createdPrevious };
  }
}
