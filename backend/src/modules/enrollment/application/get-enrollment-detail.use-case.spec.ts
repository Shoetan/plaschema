import { AppError } from '../../../platform/http/app-error';
import type { ActivityLogRepository } from '../../activity-log/application/activity-log.repository';
import type { UserRepository } from '../../identity/application/user.repository';
import { GetEnrollmentDetailUseCase } from './get-enrollment-detail.use-case';
import type { EnrollmentRepository } from './enrollment.repository';

describe('GetEnrollmentDetailUseCase', () => {
  const actor = {
    id: '01900000-0000-7000-8000-000000000099',
    role: 'admin' as const,
    email: 'admin@cbhi.local',
    name: 'Admin User',
    status: 'active' as const,
  };

  const enrollment = {
    id: '01900000-0000-7000-8000-000000000001',
    enrollmentId: 'PL/CBHI/2026/001',
    idempotencyId: '01900000-0000-7000-8000-000000000002',
    capturedAt: new Date('2026-08-29T08:00:00.000Z'),
    status: 'active' as const,
    category: 'IDPs',
    enrolledByUserId: '01900000-0000-7000-8000-000000000003',
    wardId: '01900000-0000-7000-8000-000000000004',
    healthFacilityId: '01900000-0000-7000-8000-000000000005',
    passportObjectKey: 'passport.jpg',
    idDocumentObjectKey: 'id.jpg',
    title: 'mr' as const,
    gender: 'male' as const,
    firstName: 'Musa',
    lastName: 'Ibrahim',
    middleName: null,
    dateOfBirth: '1985-03-15',
    phone: '+2348030000001',
    email: null,
    nin: '12345678901',
    maritalStatus: 'married' as const,
    bloodGroup: null,
    genotype: null,
    idType: 'nin' as const,
    nextOfKinFullName: 'Amina Ibrahim',
    emergencyPhone: '+2348030000002',
    nextOfKinRelationship: 'spouse' as const,
    stateOfResidence: 'Plateau',
    lgaOfResidence: 'Jos South',
    residentialAddress: '15 Gwagwalada Road, FCT',
    ward: {
      id: '01900000-0000-7000-8000-000000000004',
      name: 'Vom',
      lga: 'Jos South',
    },
    healthFacility: {
      id: '01900000-0000-7000-8000-000000000005',
      name: 'Vom Christian Hospital',
      ward: {
        id: '01900000-0000-7000-8000-000000000004',
        name: 'Vom',
        lga: 'Jos South',
      },
    },
    enrolledBy: {
      id: '01900000-0000-7000-8000-000000000003',
      name: 'Amina Yusuf',
    },
    printedAt: null,
    printCount: 0,
    createdAt: new Date('2026-08-29T10:00:00.000Z'),
    updatedAt: new Date('2026-08-29T10:00:00.000Z'),
  };

  let enrollments: jest.Mocked<EnrollmentRepository>;
  let users: jest.Mocked<UserRepository>;
  let activityLogs: jest.Mocked<ActivityLogRepository>;
  let useCase: GetEnrollmentDetailUseCase;

  beforeEach(() => {
    enrollments = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentRepository>;

    users = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    activityLogs = {
      findRecentByEnrollment: jest.fn(),
    } as unknown as jest.Mocked<ActivityLogRepository>;

    useCase = new GetEnrollmentDetailUseCase(enrollments, users, activityLogs);
  });

  it('returns 404 when the enrollment does not exist', async () => {
    enrollments.findById.mockResolvedValue(null);

    await expect(useCase.execute(actor, enrollment.id)).rejects.toMatchObject({
      code: 'ENROLLMENT_NOT_FOUND',
    } satisfies Partial<AppError>);
  });

  it('returns overview and unified activity log', async () => {
    const activity = {
      id: 'log-1',
      category: 'enrollment' as const,
      action: 'created' as const,
      summary: 'Musa Ibrahim enrolled by Amina Yusuf',
      wardId: enrollment.wardId,
      actor: { id: 'actor-1', name: 'Amina Yusuf' },
      enrollmentId: enrollment.id,
      occurredAt: new Date('2026-08-29T10:00:00.000Z'),
    };

    enrollments.findById.mockResolvedValue(enrollment);
    activityLogs.findRecentByEnrollment.mockResolvedValue([activity]);

    const result = await useCase.execute(actor, enrollment.id);

    expect(result.overview).toEqual({
      id: enrollment.id,
      beneficiaryName: 'Musa Ibrahim',
      enrollmentId: enrollment.enrollmentId,
      status: 'active',
      syncStatus: 'synced',
      personalDetails: {
        fullName: 'Musa Ibrahim',
        enrollmentId: enrollment.enrollmentId,
        dateOfBirth: '1985-03-15',
        gender: 'male',
        nin: '12345678901',
        phone: '+2348030000001',
        address: '15 Gwagwalada Road, FCT',
      },
    });
    expect(result.activityLog).toEqual([activity]);
    expect(activityLogs.findRecentByEnrollment).toHaveBeenCalledWith(
      enrollment.id,
      50,
    );
  });

  it('hides enrollments outside a field worker ward scope', async () => {
    enrollments.findById.mockResolvedValue(enrollment);
    users.findById.mockResolvedValue({
      id: 'fw-1',
      role: 'field_worker',
      assignedWards: ['other-ward'],
    } as never);

    await expect(
      useCase.execute(
        { ...actor, id: 'fw-1', role: 'field_worker' as const },
        enrollment.id,
      ),
    ).rejects.toMatchObject({
      code: 'ENROLLMENT_NOT_FOUND',
    } satisfies Partial<AppError>);
  });
});
