import type { ListEnrollmentsQuery } from './enrollment.repository';

export const ENROLLMENT_EXPORT_QUEUE_PORT = Symbol(
  'ENROLLMENT_EXPORT_QUEUE_PORT',
);

export type EnrollmentReportFormat = 'xlsx' | 'pdf';

export type EnrollmentExportJobPayload = {
  format: EnrollmentReportFormat;
  filters: Omit<ListEnrollmentsQuery, 'cursor' | 'limit'>;
  requestedByUserId: string;
};

export type EnrollmentExportJobResult = {
  objectKey: string;
  format: EnrollmentReportFormat;
  rowCount: number;
};

export interface EnrollmentExportQueuePort {
  enqueue(payload: EnrollmentExportJobPayload, jobId: string): Promise<string>;
}

export const ENROLLMENT_EXPORT_QUEUE_NAME = 'enrollment-report-export';
