import { AppError } from '../../../platform/http/app-error';
import type { ObjectStorage } from '../../../platform/storage/object-storage';
import type { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import type { CheckEnrollmentDuplicateUseCase } from '../../enrollment/application/check-enrollment-duplicate.use-case';
import type { EnrollmentRepository } from '../../enrollment/application/enrollment.repository';
import type { PassportPrintService } from '../../enrollment/application/passport-print.service';
import type { Enrollment } from '../../enrollment/domain/enrollment';
import type { HealthFacilityRepository } from '../../health-facility/application/health-facility.repository';
import type { UserRepository } from '../../identity/application/user.repository';
import type { WardRepository } from '../../ward/application/ward.repository';
import { CreateHouseholdEnrollmentUseCase } from './create-household-enrollment.use-case';
import type { HouseholdRepository } from './household.repository';

describe('CreateHouseholdEnrollmentUseCase', () => {
  const actor = {
    id: '01900000-0000-7000-8000-000000000099',
    role: 'field_worker' as const,
    email: 'worker@cbhi.local',
    name: 'Field Worker',
    status: 'active' as const,
  };

  const wardId = '01900000-0000-7000-8000-000000000004';
  const facilityId = '01900000-0000-7000-8000-000000000005';
  const householdLocalId = '01900000-0000-7000-8000-000000000010';
  const headIdempotencyId = '01900000-0000-7000-8000-000000000011';
  const memberIdempotencyId = '01900000-0000-7000-8000-000000000012';

  const baseInput = {
    idempotencyId: headIdempotencyId,
    capturedAt: '2026-09-09T10:00:00.000Z',
    category: 'IDPs',
    passportObjectKey: 'passport.jpg',
    idDocumentObjectKey: 'id.jpg',
    title: 'mr' as const,
    gender: 'male' as const,
    firstName: 'Musa',
    lastName: 'Ibrahim',
    dateOfBirth: '1985-03-15',
    phone: '08030000001',
    nin: '1234567890',
    maritalStatus: 'married' as const,
    idType: 'nin' as const,
    lgaOfResidence: 'Jos South',
    residentialAddress: 'Settlement Road, Vom',
    wardId,
    healthFacilityId: facilityId,
    household: {
      householdLocalId,
      householdCode: 'JOS-VOM-001',
      role: 'head' as const,
      sharedResidentialAddress: 'Settlement Road, Vom',
    },
  };

  const enrollmentFixture = (overrides: Partial<Enrollment> = {}): Enrollment => ({
    id: '01900000-0000-7000-8000-000000000001',
    enrollmentId: 'PL/CBHI/2026/010',
    idempotencyId: headIdempotencyId,
    capturedAt: new Date('2026-09-09T10:00:00.000Z'),
    status: 'pending',
    category: 'IDPs',
    enrolledByUserId: actor.id,
    wardId,
    healthFacilityId: facilityId,
    passportObjectKey: 'passport.jpg',
    passportPrintObjectKey: 'passport-print.jpg',
    idDocumentObjectKey: 'id.jpg',
    householdId: '01900000-0000-7000-8000-000000000020',
    householdRole: 'head',
    memberSequence: null,
    household: null,
    title: 'mr',
    gender: 'male',
    firstName: 'Musa',
    lastName: 'Ibrahim',
    middleName: null,
    dateOfBirth: '1985-03-15',
    phone: '08030000001',
    email: null,
    nin: '1234567890',
    maritalStatus: 'married',
    bloodGroup: null,
    genotype: null,
    idType: 'nin',
    emergencyPhone: null,
    stateOfResidence: 'Plateau',
    lgaOfResidence: 'Jos South',
    residentialAddress: 'Settlement Road, Vom',
    ward: { id: wardId, name: 'Vom', lga: 'Jos South' },
    healthFacility: {
      id: facilityId,
      name: 'Vom Christian Hospital',
      ward: { id: wardId, name: 'Vom', lga: 'Jos South' },
    },
    enrolledBy: { id: actor.id, name: actor.name },
    printedAt: null,
    printCount: 0,
    createdAt: new Date('2026-09-09T10:00:00.000Z'),
    updatedAt: new Date('2026-09-09T10:00:00.000Z'),
    ...overrides,
  });

  let households: jest.Mocked<HouseholdRepository>;
  let enrollments: jest.Mocked<EnrollmentRepository>;
  let users: jest.Mocked<UserRepository>;
  let wards: jest.Mocked<WardRepository>;
  let facilities: jest.Mocked<HealthFacilityRepository>;
  let storage: jest.Mocked<ObjectStorage>;
  let checkDuplicate: jest.Mocked<CheckEnrollmentDuplicateUseCase>;
  let recordActivity: { execute: jest.Mock };
  let passportPrint: jest.Mocked<PassportPrintService>;
  let useCase: CreateHouseholdEnrollmentUseCase;

  beforeEach(() => {
    households = {
      findByLocalId: jest.fn(),
      findById: jest.fn(),
      findByWardAndCode: jest.fn(),
      createHeadEnrollment: jest.fn(),
      createMemberEnrollment: jest.fn(),
    } as unknown as jest.Mocked<HouseholdRepository>;

    enrollments = {
      findByIdempotencyId: jest.fn(),
      allocateEnrollmentId: jest.fn(),
      findByIdentityKey: jest.fn(),
    } as unknown as jest.Mocked<EnrollmentRepository>;

    users = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    wards = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<WardRepository>;

    facilities = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<HealthFacilityRepository>;

    storage = {
      exists: jest.fn(),
    } as unknown as jest.Mocked<ObjectStorage>;

    checkDuplicate = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CheckEnrollmentDuplicateUseCase>;

    recordActivity = { execute: jest.fn().mockResolvedValue(undefined) };

    passportPrint = {
      ensureStored: jest.fn(),
    } as unknown as jest.Mocked<PassportPrintService>;

    useCase = new CreateHouseholdEnrollmentUseCase(
      households,
      enrollments,
      users,
      wards,
      facilities,
      storage,
      checkDuplicate,
      recordActivity as unknown as RecordActivityUseCase,
      passportPrint,
    );
  });

  function mockHappyPath() {
    enrollments.findByIdempotencyId.mockResolvedValue(null);
    checkDuplicate.execute.mockResolvedValue({ isDuplicate: false, id: null, enrollmentId: null });
    wards.findById.mockResolvedValue({
      id: wardId,
      name: 'Vom',
      lga: 'Jos South',
      code: 'JOS-VOM',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    users.findById.mockResolvedValue({
      id: actor.id,
      assignedWards: [{ id: wardId, name: 'Vom', lga: 'Jos South', state: 'Plateau' }],
    } as never);
    facilities.findById.mockResolvedValue({
      id: facilityId,
      wardId,
      status: 'active',
    } as never);
    storage.exists.mockResolvedValue(true);
    passportPrint.ensureStored.mockResolvedValue('passport-print.jpg');
    households.findByLocalId.mockResolvedValue(null);
    households.findByWardAndCode.mockResolvedValue(null);
    enrollments.allocateEnrollmentId.mockResolvedValue('PL/CBHI/2026/010');
  }

  it('replays an existing idempotent household enrollment', async () => {
    const existing = enrollmentFixture();
    enrollments.findByIdempotencyId.mockResolvedValue(existing);

    const result = await useCase.execute(actor, baseInput);

    expect(result).toEqual({ ...existing, idempotentReplay: true });
    expect(households.createHeadEnrollment).not.toHaveBeenCalled();
  });

  it('creates a household head enrollment', async () => {
    mockHappyPath();
    const created = enrollmentFixture();
    households.createHeadEnrollment.mockResolvedValue({
      household: {
        id: '01900000-0000-7000-8000-000000000020',
        householdLocalId,
        householdCode: 'JOS-VOM-001',
        wardId,
        headEnrollmentId: created.id,
        baseEnrollmentId: created.enrollmentId,
        residentialAddress: 'Settlement Road, Vom',
        memberCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      enrollment: created,
    });

    const result = await useCase.execute(actor, baseInput);

    expect(result.enrollmentId).toBe('PL/CBHI/2026/010');
    expect(households.createHeadEnrollment).toHaveBeenCalled();
    expect(recordActivity.execute).toHaveBeenCalled();
  });

  it('rejects member enrollment when the household head is not synced', async () => {
    mockHappyPath();
    households.findByLocalId.mockResolvedValue({
      id: '01900000-0000-7000-8000-000000000020',
      householdLocalId,
      householdCode: 'JOS-VOM-001',
      wardId,
      headEnrollmentId: null,
      baseEnrollmentId: null,
      residentialAddress: 'Settlement Road, Vom',
      memberCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(useCase.execute(actor, {
      ...baseInput,
      idempotencyId: memberIdempotencyId,
      firstName: 'Amina',
      lastName: 'Ibrahim',
      household: {
        householdLocalId,
        householdCode: 'JOS-VOM-001',
        role: 'member',
      },
    })).rejects.toMatchObject({
      code: 'HOUSEHOLD_HEAD_NOT_SYNCED',
    } satisfies Partial<AppError>);
  });
});
