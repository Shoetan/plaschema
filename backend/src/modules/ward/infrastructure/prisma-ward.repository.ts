import { Injectable } from '@nestjs/common';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import { WARD_STATE, type Ward, type WardListItem } from '../domain/ward';
import { startOfTodayInLagos } from '../domain/ward-date';
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
}
