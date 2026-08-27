import { Injectable } from '@nestjs/common';
import { buildCursorPage } from '../../../platform/http/cursor-pagination';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type { Ward } from '../domain/ward';
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
    const rows = await this.prisma.ward.findMany({
      take: limit + 1,
      ...(query.cursor ? { where: { id: { gt: query.cursor } } } : {}),
      orderBy: { id: 'asc' },
    });

    return buildCursorPage(rows, limit);
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
