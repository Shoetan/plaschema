import { AppError } from '../../../platform/http/app-error';
import type { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import type { HealthFacilityRepository } from '../../health-facility/application/health-facility.repository';
import type { WardRepository } from '../../ward/application/ward.repository';
import type { AttachEnrollmentFileUrls } from './attach-enrollment-file-urls';
import { CheckEnrollmentDuplicateUseCase } from './check-enrollment-duplicate.use-case';
import { UpdateEnrollmentUseCase } from './update-enrollment.use-case';
import type { EnrollmentRepository } from './enrollment.repository';

describe('UpdateEnrollmentUseCase', () => {
  const actor = {
    id: '01900000-0000-7000-8000-000000000099',
    role: 'admin' as const,
    email: 'admin@cbhi.local',
    name: 'Admin User',
    status: 'active' as const,
  };

  const enrollmentId = '01900000-0000-7000-8000-000000000001';
  const wardId = '01900000-0000-7000-8000-000000000010';
  const facilityId = '01900000-0000-7000-8000-000000000020';

  const existing = {
    id: enrollmentId,
    enrollmentId: 'PL/CBHI/2026/001',
    idempotencyId: '01900000-0000-7000-8000-000000000002',
    capturedAt: null,
    status: 'active' as const,
    category: 'IDPs',
    enrolledByUserId: actor.id,
    wardId,
    healthFacilityId: facilityId,
    passportObjectKey: 'passport/key',
    passportPrintObjectKey: 'passport/print',
    idDocumentObjectKey: 'id/key',
    title: 'mr' as const,
    gender: 'male' as const,
    firstName: 'Musa',
    lastName: 'Ibrahim',
    middleName: null,
    dateOfBirth: '1990-05-04',
    phone: '08012345678',
    email: null,
    nin: null,
    maritalStatus: 'single' as const,
    bloodGroup: null,
    genotype: null,
    idType: 'nin' as const,
    emergencyPhone: null,
    stateOfResidence: 'Plateau',
    lgaOfResidence: 'Jos North',
    residentialAddress: '12 Yakubu Gowon Way',
    householdId: null,
    householdRole: null,
    memberSequence: null,
    household: null,
    ward: { id: wardId, name: 'Tudun Wada', lga: 'Jos North' },
    healthFacility: {
      id: facilityId,
      name: 'Tudun Wada PHC',
      ward: { id: wardId, name: 'Tudun Wada', lga: 'Jos North' },
    },
    enrolledBy: { id: actor.id, name: actor.name },
    printedAt: null,
    printCount: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  let enrollments: jest.Mocked<EnrollmentRepository>;
  let wards: jest.Mocked<Pick<WardRepository, 'findById'>>;
  let facilities: jest.Mocked<Pick<HealthFacilityRepository, 'findById'>>;
  let checkDuplicate: jest.Mocked<Pick<CheckEnrollmentDuplicateUseCase, 'execute'>>;
  let recordActivity: jest.Mocked<Pick<RecordActivityUseCase, 'execute'>>;
  let attachFileUrls: jest.Mocked<Pick<AttachEnrollmentFileUrls, 'forOne'>>;
  let useCase: UpdateEnrollmentUseCase;

  beforeEach(() => {
    enrollments = {
      findById: jest.fn().mockResolvedValue(existing),
      update: jest.fn().mockImplementation(async (_id, patch) => ({
        ...existing,
        ...patch,
        dateOfBirth:
          patch.dateOfBirth instanceof Date
            ? '1991-06-05'
            : existing.dateOfBirth,
      })),
    } as unknown as jest.Mocked<EnrollmentRepository>;

    wards = { findById: jest.fn() };
    facilities = {
      findById: jest.fn().mockResolvedValue({
        id: facilityId,
        wardId,
      }),
    };
    checkDuplicate = { execute: jest.fn().mockResolvedValue({ isDuplicate: false, id: null, enrollmentId: null }) };
    recordActivity = { execute: jest.fn().mockResolvedValue({}) };
    attachFileUrls = {
      forOne: jest.fn().mockImplementation(async (record) => ({
        ...record,
        passportUrl: 'https://example.com/passport',
        idDocumentUrl: 'https://example.com/id',
        fileUrlExpiresInSeconds: 3600,
        hasPrinted: false,
      })),
    };

    useCase = new UpdateEnrollmentUseCase(
      enrollments,
      wards as unknown as WardRepository,
      facilities as unknown as HealthFacilityRepository,
      checkDuplicate as unknown as CheckEnrollmentDuplicateUseCase,
      recordActivity as unknown as RecordActivityUseCase,
      attachFileUrls as unknown as AttachEnrollmentFileUrls,
    );
  });

  it('rejects empty updates', async () => {
    await expect(useCase.execute(actor, enrollmentId, {})).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    } satisfies Partial<AppError>);
  });

  it('updates changed fields and records activity', async () => {
    const result = await useCase.execute(actor, enrollmentId, {
      phone: '08099998888',
    });

    expect(enrollments.update).toHaveBeenCalledWith(enrollmentId, {
      phone: '08099998888',
    });
    expect(recordActivity.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'updated',
        enrollmentId,
        metadata: { changedFields: ['phone'] },
      }),
    );
    expect(result.phone).toBe('08099998888');
  });

  it('returns the existing record when values are unchanged', async () => {
    await useCase.execute(actor, enrollmentId, { phone: existing.phone });

    expect(enrollments.update).not.toHaveBeenCalled();
    expect(recordActivity.execute).not.toHaveBeenCalled();
    expect(attachFileUrls.forOne).toHaveBeenCalledWith(existing);
  });

  it('rejects duplicate identity updates', async () => {
    checkDuplicate.execute.mockResolvedValue({
      isDuplicate: true,
      id: 'other-id',
      enrollmentId: 'PL/CBHI/2026/999',
    });

    await expect(
      useCase.execute(actor, enrollmentId, { firstName: 'Ada' }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_ENROLLMENT' } satisfies Partial<AppError>);
  });
});
