import { AppError } from '../../../platform/http/app-error';
import type { ObjectStorage } from '../../../platform/storage/object-storage';
import type { FileJobRepository } from './file-job.repository';
import { GetFileJobDownloadUrlUseCase } from './get-file-job-download-url.use-case';

describe('GetFileJobDownloadUrlUseCase', () => {
  let fileJobs: jest.Mocked<FileJobRepository>;
  let storage: jest.Mocked<ObjectStorage>;
  let useCase: GetFileJobDownloadUrlUseCase;

  const actor = {
    id: 'user-1',
    role: 'admin' as const,
    email: 'a@b.c',
    name: 'Admin',
    status: 'active' as const,
  };

  beforeEach(() => {
    fileJobs = {
      findByIdForUser: jest.fn(),
    } as unknown as jest.Mocked<FileJobRepository>;

    storage = {
      createReadUrl: jest.fn(),
    } as unknown as jest.Mocked<ObjectStorage>;

    useCase = new GetFileJobDownloadUrlUseCase(fileJobs, storage);
  });

  it('returns a presigned URL for a completed job owned by the user', async () => {
    fileJobs.findByIdForUser.mockResolvedValue({
      id: 'job-1',
      requestedByUserId: 'user-1',
      kind: 'enrollment_report',
      format: 'xlsx',
      status: 'completed',
      statusRank: 3,
      title: 'Enrollment Report (xlsx) — 30-08-2026 11:26',
      objectKey: 'enrollment-reports/job-1.xlsx',
      error: null,
      metadata: { rowCount: 10 },
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: new Date(),
    });

    storage.createReadUrl.mockResolvedValue({
      objectKey: 'enrollment-reports/job-1.xlsx',
      readUrl: 'https://example.com/file',
      expiresInSeconds: 1800,
      downloadFilename: 'Enrollment Report (xlsx) — 30-08-2026 11-26.xlsx',
    });

    await expect(useCase.execute(actor, 'job-1')).resolves.toEqual({
      jobId: 'job-1',
      downloadUrl: 'https://example.com/file',
      expiresInSeconds: 1800,
      title: 'Enrollment Report (xlsx) — 30-08-2026 11:26',
      filename: 'Enrollment Report (xlsx) — 30-08-2026 11-26.xlsx',
      format: 'xlsx',
    });

    expect(storage.createReadUrl).toHaveBeenCalledWith(
      'enrollment-reports/job-1.xlsx',
      {
        downloadFilename: 'Enrollment Report (xlsx) — 30-08-2026 11-26.xlsx',
      },
    );
  });

  it('rejects download when the job is not completed', async () => {
    fileJobs.findByIdForUser.mockResolvedValue({
      id: 'job-1',
      requestedByUserId: 'user-1',
      kind: 'id_card',
      format: 'pdf',
      status: 'processing',
      statusRank: 1,
      title: 'ID Cards (2) — 30-08-2026 11:26',
      objectKey: null,
      error: null,
      metadata: null,
      createdAt: new Date(),
      startedAt: new Date(),
      completedAt: null,
    });

    await expect(useCase.execute(actor, 'job-1')).rejects.toMatchObject({
      code: 'FILE_JOB_NOT_READY',
    } satisfies Partial<AppError>);
  });

  it('returns 404 when the job is not owned by the user', async () => {
    fileJobs.findByIdForUser.mockResolvedValue(null);

    await expect(useCase.execute(actor, 'job-1')).rejects.toMatchObject({
      code: 'FILE_JOB_NOT_FOUND',
    } satisfies Partial<AppError>);
  });
});
