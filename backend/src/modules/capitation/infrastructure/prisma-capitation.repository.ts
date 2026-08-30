import { Injectable } from '@nestjs/common';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { createUuidV7 } from '../../../platform/ids/uuid-v7';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import { formatCapitationPeriod, currentMonthYearInLagos } from '../../ward/domain/ward-date';
import type {
  CapitationGenerateResult,
  CapitationPreviewResult,
  CapitationRecordDraft,
  CapitationRecordListItem,
  CapitationRunSummary,
  HealthFacilityCapitationDetail,
} from '../domain/capitation';
import { sortCapitationListRecords } from '../domain/capitation';
import type {
  CapitationRepository,
  CreateCapitationRunInput,
  ListCapitationsQuery,
  PaginatedCapitations,
} from '../application/capitation.repository';

function summarizeRecords(
  records: CapitationRecordDraft[],
  month: number,
  year: number,
  rate: number,
): Pick<
  CapitationPreviewResult,
  'totalFacilities' | 'totalBeneficiaries' | 'totalCapitation'
> {
  return {
    totalFacilities: records.length,
    totalBeneficiaries: records.reduce((sum, r) => sum + r.beneficiaryCount, 0),
    totalCapitation: records.reduce((sum, r) => sum + r.amount, 0),
  };
}

@Injectable()
export class PrismaCapitationRepository implements CapitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async computeRecords(rate: number): Promise<CapitationRecordDraft[]> {
    const [facilities, enrollmentCounts] = await Promise.all([
      this.prisma.healthFacility.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          name: true,
          lga: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.enrollment.groupBy({
        by: ['healthFacilityId'],
        where: { status: 'active' },
        _count: { _all: true },
      }),
    ]);

    const countByFacility = new Map(
      enrollmentCounts.map((row) => [
        row.healthFacilityId,
        row._count._all,
      ]),
    );

    return facilities.map((facility) => {
      const beneficiaryCount = countByFacility.get(facility.id) ?? 0;
      return {
        healthFacilityId: facility.id,
        facilityName: facility.name,
        lga: facility.lga,
        beneficiaryCount,
        rate,
        amount: beneficiaryCount * rate,
      };
    });
  }

  async preview(
    month: number,
    year: number,
    rate: number,
  ): Promise<CapitationPreviewResult> {
    const records = await this.computeRecords(rate);
    return {
      month,
      year,
      rate,
      ...summarizeRecords(records, month, year, rate),
      records,
    };
  }

  async createRun(
    input: CreateCapitationRunInput,
  ): Promise<CapitationGenerateResult> {
    const runId = createUuidV7();

    const run = await this.prisma.$transaction(async (tx) => {
      const created = await tx.capitationRun.create({
        data: {
          id: runId,
          month: input.month,
          year: input.year,
          rate: input.rate,
          createdByUserId: input.createdByUserId,
        },
      });

      if (input.records.length > 0) {
        await tx.capitationRecord.createMany({
          data: input.records.map((record) => ({
            id: createUuidV7(),
            runId: created.id,
            healthFacilityId: record.healthFacilityId,
            facilityName: record.facilityName,
            lga: record.lga,
            beneficiaryCount: record.beneficiaryCount,
            rate: record.rate,
            amount: record.amount,
          })),
        });
      }

      return created;
    });

    const totals = summarizeRecords(
      input.records,
      input.month,
      input.year,
      input.rate,
    );

    return {
      runId: run.id,
      month: run.month,
      year: run.year,
      rate: run.rate,
      generatedAt: run.createdAt,
      ...totals,
      recordCount: input.records.length,
    };
  }

  private async findLatestRun(month: number, year: number) {
    return this.prisma.capitationRun.findFirst({
      where: { month, year },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildRunSummary(
    run: {
      id: string;
      month: number;
      year: number;
      rate: number;
      createdAt: Date;
    },
    records: CapitationRecordDraft[],
  ): CapitationRunSummary {
    const totals = summarizeRecords(records, run.month, run.year, run.rate);
    return {
      runId: run.id,
      month: run.month,
      year: run.year,
      rate: run.rate,
      generatedAt: run.createdAt,
      ...totals,
    };
  }

  async list(query: ListCapitationsQuery): Promise<PaginatedCapitations> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });
    const latestRun = await this.findLatestRun(query.month, query.year);

    if (!latestRun) {
      return {
        items: [],
        summary: null,
        nextCursor: null,
        hasMore: false,
        limit,
      };
    }

    const allRunRecords = await this.prisma.capitationRecord.findMany({
      where: { runId: latestRun.id },
    });

    const summary = this.buildRunSummary(
      latestRun,
      allRunRecords.map((row) => ({
        healthFacilityId: row.healthFacilityId,
        facilityName: row.facilityName,
        lga: row.lga,
        beneficiaryCount: row.beneficiaryCount,
        rate: row.rate,
        amount: row.amount,
      })),
    );

    const filteredRecords = allRunRecords.filter((row) => {
      if (
        query.healthFacilityId &&
        row.healthFacilityId !== query.healthFacilityId
      ) {
        return false;
      }
      if (
        query.lga &&
        row.lga.toLowerCase() !== query.lga.toLowerCase()
      ) {
        return false;
      }
      if (query.search) {
        const term = query.search.toLowerCase();
        if (
          !row.facilityName.toLowerCase().includes(term) &&
          !row.lga.toLowerCase().includes(term)
        ) {
          return false;
        }
      }
      return true;
    });

    const sortedRecords = sortCapitationListRecords(filteredRecords);

    let startIndex = 0;
    if (query.cursor) {
      const cursorIndex = sortedRecords.findIndex((row) => row.id === query.cursor);
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const pageRows = sortedRecords.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < sortedRecords.length;
    const last = pageRows[pageRows.length - 1];

    const items: CapitationRecordListItem[] = pageRows.map((row) => ({
      id: row.id,
      healthFacilityId: row.healthFacilityId,
      facilityName: row.facilityName,
      lga: row.lga,
      month: latestRun.month,
      year: latestRun.year,
      period: formatCapitationPeriod(latestRun.month, latestRun.year),
      beneficiaryCount: row.beneficiaryCount,
      rate: row.rate,
      amount: row.amount,
    }));

    return {
      items,
      summary,
      nextCursor: hasMore && last ? last.id : null,
      hasMore,
      limit,
    };
  }

  async findCurrentAmountForFacility(
    healthFacilityId: string,
    month: number,
    year: number,
  ): Promise<number | null> {
    const latestRun = await this.findLatestRun(month, year);
    if (!latestRun) {
      return null;
    }

    const record = await this.prisma.capitationRecord.findFirst({
      where: {
        runId: latestRun.id,
        healthFacilityId,
      },
      select: { amount: true },
    });

    return record?.amount ?? null;
  }

  async findFacilityCapitation(
    healthFacilityId: string,
  ): Promise<HealthFacilityCapitationDetail> {
    const { month, year } = currentMonthYearInLagos();

    const currentAmount = await this.findCurrentAmountForFacility(
      healthFacilityId,
      month,
      year,
    );

    const records = await this.prisma.capitationRecord.findMany({
      where: { healthFacilityId },
      include: { run: true },
      orderBy: { run: { createdAt: 'desc' } },
    });

    const seen = new Set<string>();
    const history: HealthFacilityCapitationDetail['records'] = [];

    for (const record of records) {
      const key = `${record.run.year}-${record.run.month}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      history.push({
        month: record.run.month,
        year: record.run.year,
        period: formatCapitationPeriod(record.run.month, record.run.year),
        beneficiaryCount: record.beneficiaryCount,
        rate: record.rate,
        amount: record.amount,
        generatedAt: record.run.createdAt,
      });
    }

    return {
      implemented: true,
      currentAmount,
      currency: 'NGN',
      records: history,
    };
  }
}
