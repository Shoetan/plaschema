import { Injectable } from '@nestjs/common';
import { buildCursorPage } from '../../../platform/http/cursor-pagination';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import type { HealthFacility } from '../domain/health-facility';
import type {
  CreateHealthFacilityInput,
  HealthFacilityRepository,
  ListHealthFacilitiesQuery,
  PaginatedHealthFacilities,
  StreamHealthFacilitiesQuery,
  UpdateHealthFacilityInput,
} from '../application/health-facility.repository';

type FacilityRow = {
  id: string;
  name: string;
  lga: string;
  wardId: string;
  createdAt: Date;
  updatedAt: Date;
  ward: { id: string; name: string; lga: string };
};

@Injectable()
export class PrismaHealthFacilityRepository implements HealthFacilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  private include = {
    ward: { select: { id: true, name: true, lga: true } },
  } as const;

  private map(row: FacilityRow): HealthFacility {
    return {
      id: row.id,
      name: row.name,
      lga: row.lga,
      wardId: row.wardId,
      ward: row.ward,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async create(input: CreateHealthFacilityInput): Promise<HealthFacility> {
    const row = await this.prisma.healthFacility.create({
      data: input,
      include: this.include,
    });
    return this.map(row);
  }

  async createMany(inputs: CreateHealthFacilityInput[]): Promise<number> {
    if (inputs.length === 0) {
      return 0;
    }
    const result = await this.prisma.healthFacility.createMany({
      data: inputs,
      skipDuplicates: true,
    });
    return result.count;
  }

  async findById(id: string): Promise<HealthFacility | null> {
    const row = await this.prisma.healthFacility.findUnique({
      where: { id },
      include: this.include,
    });
    return row ? this.map(row) : null;
  }

  async findByNameAndWard(
    name: string,
    wardId: string,
  ): Promise<HealthFacility | null> {
    const row = await this.prisma.healthFacility.findUnique({
      where: { name_wardId: { name, wardId } },
      include: this.include,
    });
    return row ? this.map(row) : null;
  }

  async list(
    query: ListHealthFacilitiesQuery,
  ): Promise<PaginatedHealthFacilities> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });
    const where = {
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      ...(query.wardId ? { wardId: query.wardId } : {}),
      ...(query.lga
        ? { lga: { equals: query.lga, mode: 'insensitive' as const } }
        : {}),
    };

    const rows = await this.prisma.healthFacility.findMany({
      where,
      take: limit + 1,
      orderBy: { id: 'asc' },
      include: this.include,
    });

    return buildCursorPage(
      rows.map((row) => this.map(row)),
      limit,
    );
  }

  async *stream(
    query: StreamHealthFacilitiesQuery,
  ): AsyncGenerator<HealthFacility[], void, unknown> {
    let cursor: string | undefined;
    const batchSize = toQueryInt(query.batchSize, 200, { min: 1, max: 500 });

    for (;;) {
      const rows = await this.prisma.healthFacility.findMany({
        where: {
          ...(cursor ? { id: { gt: cursor } } : {}),
          ...(query.wardId ? { wardId: query.wardId } : {}),
          ...(query.updatedSince
            ? { updatedAt: { gte: query.updatedSince } }
            : {}),
        },
        take: batchSize,
        orderBy: { id: 'asc' },
        include: this.include,
      });

      if (rows.length === 0) {
        return;
      }

      yield rows.map((row) => this.map(row));
      cursor = rows[rows.length - 1]?.id;
      if (rows.length < batchSize || !cursor) {
        return;
      }
    }
  }

  async update(
    id: string,
    input: UpdateHealthFacilityInput,
  ): Promise<HealthFacility> {
    const row = await this.prisma.healthFacility.update({
      where: { id },
      data: input,
      include: this.include,
    });
    return this.map(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.healthFacility.delete({ where: { id } });
  }
}
