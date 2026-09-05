import { AppError } from '../../../platform/http/app-error';
import type { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import { UpdateEnrollmentStatusUseCase } from './update-enrollment-status.use-case';
import type { EnrollmentRepository } from './enrollment.repository';

describe('UpdateEnrollmentStatusUseCase', () => {
  const actor = {
    id: '01900000-0000-7000-8000-000000000099',
    role: 'admin' as const,
    email: 'admin@cbhi.local',
    name: 'Admin User',
    status: 'active' as const,
  };

  const id1 = '01900000-0000-7000-8000-000000000001';
  const id2 = '01900000-0000-7000-8000-000000000002';
  const id3 = '01900000-0000-7000-8000-000000000003';

  let enrollments: jest.Mocked<EnrollmentRepository>;
  let recordActivity: jest.Mocked<Pick<RecordActivityUseCase, 'execute'>>;
  let useCase: UpdateEnrollmentStatusUseCase;

  beforeEach(() => {
    enrollments = {
      findManyStatusByIds: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<EnrollmentRepository>;

    recordActivity = {
      execute: jest.fn().mockResolvedValue({}),
    };

    useCase = new UpdateEnrollmentStatusUseCase(
      enrollments,
      recordActivity as unknown as RecordActivityUseCase,
    );
  });

  it('rejects empty and oversized batches', async () => {
    await expect(
      useCase.execute(actor, { enrollmentIds: [], status: 'active' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' } satisfies Partial<AppError>);

    await expect(
      useCase.execute(actor, {
        enrollmentIds: Array.from({ length: 101 }, (_, i) =>
          `01900000-0000-7000-8000-${String(i).padStart(12, '0')}`,
        ),
        status: 'disabled',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' } satisfies Partial<AppError>);
  });

  it('rejects duplicate ids', async () => {
    await expect(
      useCase.execute(actor, {
        enrollmentIds: [id1, id1],
        status: 'active',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' } satisfies Partial<AppError>);
  });

  it('activates eligible rows and skips others', async () => {
    enrollments.findManyStatusByIds.mockResolvedValue([
      {
        id: id1,
        enrollmentId: 'PL/CBHI/2026/001',
        status: 'pending',
        wardId: 'ward-1',
        firstName: 'Musa',
        lastName: 'Ibrahim',
      },
      {
        id: id2,
        enrollmentId: 'PL/CBHI/2026/002',
        status: 'active',
        wardId: 'ward-1',
        firstName: 'Aisha',
        lastName: 'Mohammed',
      },
      {
        id: id3,
        enrollmentId: 'PL/CBHI/2026/003',
        status: 'deceased',
        wardId: 'ward-1',
        firstName: 'Tunde',
        lastName: 'Bakare',
      },
    ]);
    enrollments.updateStatus.mockResolvedValue(1);

    const missingId = '01900000-0000-7000-8000-000000000099';
    const result = await useCase.execute(actor, {
      enrollmentIds: [id1, id2, id3, missingId],
      status: 'active',
    });

    expect(enrollments.updateStatus).toHaveBeenCalledWith([id1], 'active');
    expect(recordActivity.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 'active',
      updated: 1,
      updatedIds: [id1],
      skipped: [
        { id: id2, reason: 'unchanged', currentStatus: 'active' },
        { id: id3, reason: 'invalid_transition', currentStatus: 'deceased' },
        { id: missingId, reason: 'not_found' },
      ],
    });
  });

  it('executeOne returns 404 when missing', async () => {
    enrollments.findManyStatusByIds.mockResolvedValue([]);

    await expect(
      useCase.executeOne(actor, id1, 'disabled'),
    ).rejects.toMatchObject({
      code: 'ENROLLMENT_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('executeOne returns 409 on invalid transition', async () => {
    enrollments.findManyStatusByIds.mockResolvedValue([
      {
        id: id1,
        enrollmentId: 'PL/CBHI/2026/001',
        status: 'deceased',
        wardId: 'ward-1',
        firstName: 'Musa',
        lastName: 'Ibrahim',
      },
    ]);

    await expect(
      useCase.executeOne(actor, id1, 'active'),
    ).rejects.toMatchObject({
      code: 'INVALID_STATUS_TRANSITION',
    } satisfies Partial<AppError>);
  });
});
