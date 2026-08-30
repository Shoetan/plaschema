import { formatFileJobTimestampLagos, buildFileJobTitle } from './file-job-title';

describe('file-job-title', () => {
  const createdAt = new Date('2026-08-30T10:26:00.000Z');

  it('formats Lagos timestamps as DD-MM-YYYY HH:mm', () => {
    expect(formatFileJobTimestampLagos(createdAt)).toBe('30-08-2026 11:26');
  });

  it('builds an ID card title with enrollment count and date', () => {
    expect(
      buildFileJobTitle({
        kind: 'id_card',
        format: 'pdf',
        enrollmentCount: 3,
        createdAt,
      }),
    ).toBe('ID Cards (3) — 30-08-2026 11:26');
  });

  it('builds an enrollment report title with format and date', () => {
    expect(
      buildFileJobTitle({
        kind: 'enrollment_report',
        format: 'xlsx',
        createdAt,
      }),
    ).toBe('Enrollment Report (xlsx) — 30-08-2026 11:26');
  });
});
