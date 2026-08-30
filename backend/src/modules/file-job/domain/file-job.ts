export type FileJobKind = 'id_card' | 'enrollment_report';

export type FileJobFormat = 'pdf' | 'xlsx';

export type FileJobStatus = 'queued' | 'processing' | 'failed' | 'completed';

export const FILE_JOB_KINDS: FileJobKind[] = ['id_card', 'enrollment_report'];

export const FILE_JOB_FORMATS: FileJobFormat[] = ['pdf', 'xlsx'];

export const FILE_JOB_STATUSES: FileJobStatus[] = [
  'queued',
  'processing',
  'failed',
  'completed',
];

export type FileJobMetadata = {
  enrollmentCount?: number;
  rowCount?: number;
  enrollmentIds?: string[];
};

export type FileJob = {
  id: string;
  requestedByUserId: string;
  kind: FileJobKind;
  format: FileJobFormat;
  status: FileJobStatus;
  statusRank: number;
  title: string;
  objectKey: string | null;
  error: string | null;
  metadata: FileJobMetadata | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type FileJobListItem = FileJob & {
  canDownload: boolean;
};

export function fileJobStatusRank(status: FileJobStatus): number {
  switch (status) {
    case 'queued':
      return 0;
    case 'processing':
      return 1;
    case 'failed':
      return 2;
    case 'completed':
      return 3;
  }
}
