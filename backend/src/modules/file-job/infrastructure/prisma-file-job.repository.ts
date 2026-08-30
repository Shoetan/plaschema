import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { toQueryInt } from '../../../platform/http/query-transforms';
import { PrismaService } from '../../../platform/persistence/prisma.service';
import {
  fileJobStatusRank,
  type FileJob,
  type FileJobListItem,
  type FileJobMetadata,
} from '../domain/file-job';
import type {
  CreateFileJobInput,
  FileJobListCursor,
  FileJobRepository,
  ListFileJobsQuery,
  PaginatedFileJobs,
} from '../application/file-job.repository';

type FileJobRow = {
  id: string;
  requestedByUserId: string;
  kind: FileJob['kind'];
  format: FileJob['format'];
  status: FileJob['status'];
  statusRank: number;
  title: string;
  objectKey: string | null;
  error: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

function encodeListCursor(cursor: FileJobListCursor): string {
  return Buffer.from(
    JSON.stringify({
      sr: cursor.statusRank,
      ca: cursor.createdAt.toISOString(),
      id: cursor.id,
    }),
    'utf8',
  ).toString('base64url');
}

function decodeListCursor(cursor: string): FileJobListCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { sr?: number; ca?: string; id?: string };

    if (
      typeof parsed.sr !== 'number' ||
      typeof parsed.ca !== 'string' ||
      typeof parsed.id !== 'string'
    ) {
      return null;
    }

    const createdAt = new Date(parsed.ca);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return {
      statusRank: parsed.sr,
      createdAt,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

function mapMetadata(value: Prisma.JsonValue | null): FileJobMetadata | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    ...(typeof record.enrollmentCount === 'number'
      ? { enrollmentCount: record.enrollmentCount }
      : {}),
    ...(typeof record.rowCount === 'number' ? { rowCount: record.rowCount } : {}),
    ...(Array.isArray(record.enrollmentIds)
      ? { enrollmentIds: record.enrollmentIds.filter((id) => typeof id === 'string') }
      : {}),
  };
}

@Injectable()
export class PrismaFileJobRepository implements FileJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: FileJobRow): FileJob {
    return {
      id: row.id,
      requestedByUserId: row.requestedByUserId,
      kind: row.kind,
      format: row.format,
      status: row.status,
      statusRank: row.statusRank,
      title: row.title,
      objectKey: row.objectKey,
      error: row.error,
      metadata: mapMetadata(row.metadata),
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
    };
  }

  private mapListItem(row: FileJobRow): FileJobListItem {
    return {
      ...this.map(row),
      canDownload: row.status === 'completed' && row.objectKey != null,
    };
  }

  async create(input: CreateFileJobInput): Promise<FileJob> {
    const row = await this.prisma.fileJob.create({
      data: {
        id: input.id,
        requestedByUserId: input.requestedByUserId,
        kind: input.kind,
        format: input.format,
        status: 'queued',
        statusRank: fileJobStatusRank('queued'),
        title: input.title,
        metadata: input.metadata ?? undefined,
      },
    });

    return this.map(row);
  }

  async findByIdForUser(
    id: string,
    requestedByUserId: string,
  ): Promise<FileJob | null> {
    const row = await this.prisma.fileJob.findFirst({
      where: { id, requestedByUserId },
    });
    return row ? this.map(row) : null;
  }

  async list(query: ListFileJobsQuery): Promise<PaginatedFileJobs> {
    const limit = toQueryInt(query.limit, 50, { min: 1, max: 100 });
    const cursor = query.cursor ? decodeListCursor(query.cursor) : null;

    const cursorFilter = cursor
      ? {
          OR: [
            { statusRank: { gt: cursor.statusRank } },
            {
              statusRank: cursor.statusRank,
              createdAt: { lt: cursor.createdAt },
            },
            {
              statusRank: cursor.statusRank,
              createdAt: cursor.createdAt,
              id: { lt: cursor.id },
            },
          ],
        }
      : {};

    const rows = await this.prisma.fileJob.findMany({
      where: {
        requestedByUserId: query.requestedByUserId,
        ...(query.status ? { status: query.status } : {}),
        ...cursorFilter,
      },
      orderBy: [
        { statusRank: 'asc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = pageRows.map((row) => this.mapListItem(row));
    const last = pageRows[pageRows.length - 1];

    return {
      items,
      hasMore,
      limit,
      nextCursor:
        hasMore && last
          ? encodeListCursor({
              statusRank: last.statusRank,
              createdAt: last.createdAt,
              id: last.id,
            })
          : null,
    };
  }

  async markProcessing(id: string): Promise<FileJob | null> {
    const row = await this.prisma.fileJob.updateMany({
      where: { id, status: 'queued' },
      data: {
        status: 'processing',
        statusRank: fileJobStatusRank('processing'),
        startedAt: new Date(),
      },
    });

    if (row.count === 0) {
      const existing = await this.prisma.fileJob.findUnique({ where: { id } });
      return existing ? this.map(existing) : null;
    }

    const updated = await this.prisma.fileJob.findUnique({ where: { id } });
    return updated ? this.map(updated) : null;
  }

  async markCompleted(
    id: string,
    input: { objectKey: string; metadata?: FileJobMetadata },
  ): Promise<FileJob | null> {
    const completedAt = new Date();
    const row = await this.prisma.fileJob.update({
      where: { id },
      data: {
        status: 'completed',
        statusRank: fileJobStatusRank('completed'),
        objectKey: input.objectKey,
        error: null,
        metadata: input.metadata ?? undefined,
        completedAt,
      },
    });

    return this.map(row);
  }

  async markFailed(id: string, error: string): Promise<FileJob | null> {
    const completedAt = new Date();
    const row = await this.prisma.fileJob.update({
      where: { id },
      data: {
        status: 'failed',
        statusRank: fileJobStatusRank('failed'),
        error,
        completedAt,
      },
    });

    return this.map(row);
  }
}
