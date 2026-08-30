import type { CursorPage } from '../../../platform/http/cursor-pagination';
import type {
  FileJob,
  FileJobFormat,
  FileJobKind,
  FileJobListItem,
  FileJobMetadata,
  FileJobStatus,
} from '../domain/file-job';

export const FILE_JOB_REPOSITORY = Symbol('FILE_JOB_REPOSITORY');

export type CreateFileJobInput = {
  id: string;
  requestedByUserId: string;
  kind: FileJobKind;
  format: FileJobFormat;
  title: string;
  metadata?: FileJobMetadata;
};

export type ListFileJobsQuery = {
  requestedByUserId: string;
  cursor?: string;
  limit: number;
  status?: FileJobStatus;
};

export type FileJobListCursor = {
  statusRank: number;
  createdAt: Date;
  id: string;
};

export type PaginatedFileJobs = CursorPage<FileJobListItem>;

export interface FileJobRepository {
  create(input: CreateFileJobInput): Promise<FileJob>;
  findByIdForUser(id: string, requestedByUserId: string): Promise<FileJob | null>;
  list(query: ListFileJobsQuery): Promise<PaginatedFileJobs>;
  markProcessing(id: string): Promise<FileJob | null>;
  markCompleted(
    id: string,
    input: { objectKey: string; metadata?: FileJobMetadata },
  ): Promise<FileJob | null>;
  markFailed(id: string, error: string): Promise<FileJob | null>;
}
