import { buildFileJobDownloadFilename } from './file-job-download-filename';
import { buildContentDispositionAttachment } from '../../../platform/storage/content-disposition';

describe('file-job-download-filename', () => {
  it('builds a download filename from the job title and format', () => {
    expect(
      buildFileJobDownloadFilename(
        'Enrollment Report (xlsx) — 30-08-2026 11:26',
        'xlsx',
      ),
    ).toBe('Enrollment Report (xlsx) — 30-08-2026 11-26.xlsx');
  });

  it('does not duplicate the extension when already present', () => {
    expect(
      buildFileJobDownloadFilename('ID Cards (3) — 30-08-2026 11:26.pdf', 'pdf'),
    ).toBe('ID Cards (3) — 30-08-2026 11-26.pdf');
  });

  it('builds a content-disposition header with UTF-8 filename support', () => {
    expect(
      buildContentDispositionAttachment('ID Cards (3) — 30-08-2026 11:26.pdf'),
    ).toBe(
      'attachment; filename="ID Cards (3) - 30-08-2026 11:26.pdf"; filename*=UTF-8\'\'ID%20Cards%20(3)%20%E2%80%94%2030-08-2026%2011%3A26.pdf',
    );
  });
});
