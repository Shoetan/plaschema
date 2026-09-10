import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { createUuidV7, isUuidV7 } from '../../../platform/ids/uuid-v7';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import { normalizePlaceName, toTitleCase } from '../../../shared/text';
import { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from '../../health-facility/application/health-facility.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../identity/application/user.repository';
import {
  WARD_REPOSITORY,
  type WardRepository,
} from '../../ward/application/ward.repository';
import type { CreateEnrollmentInput } from '../../enrollment/application/create-enrollment-input';
import { CheckEnrollmentDuplicateUseCase } from '../../enrollment/application/check-enrollment-duplicate.use-case';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from '../../enrollment/application/enrollment.repository';
import type { Enrollment } from '../../enrollment/domain/enrollment';
import {
  assertReasonableDateOfBirth,
  normalizeEnrollmentNameKey,
  parseIsoDateOnly,
} from '../../enrollment/domain/enrollment-identity';
import { fieldWorkerCanAccessWard } from '../../enrollment/application/field-worker-ward-access';
import { PassportPrintService } from '../../enrollment/application/passport-print.service';
import type { HouseholdRole } from '../domain/household';
import {
  HOUSEHOLD_REPOSITORY,
  type HouseholdRepository,
} from './household.repository';

export type CreateHouseholdEnrollmentInput = CreateEnrollmentInput & {
  household: {
    householdLocalId: string;
    householdCode: string;
    role: HouseholdRole;
    householdId?: string;
    sharedResidentialAddress?: string | null;
  };
};

@Injectable()
export class CreateHouseholdEnrollmentUseCase {
  constructor(
    @Inject(HOUSEHOLD_REPOSITORY)
    private readonly households: HouseholdRepository,
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly checkDuplicate: CheckEnrollmentDuplicateUseCase,
    private readonly recordActivity: RecordActivityUseCase,
    private readonly passportPrint: PassportPrintService,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: CreateHouseholdEnrollmentInput,
  ): Promise<Enrollment> {
    if (!isUuidV7(input.idempotencyId)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'idempotencyId must be a UUID v7',
        400,
      );
    }
    if (!isUuidV7(input.household.householdLocalId)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'household.householdLocalId must be a UUID v7',
        400,
      );
    }

    const existingByIdempotency = await this.enrollments.findByIdempotencyId(
      input.idempotencyId,
    );
    if (existingByIdempotency) {
      return { ...existingByIdempotency, idempotentReplay: true };
    }

    const prepared = await this.prepareEnrollment(actor, input);

    if (input.household.role === 'head') {
      return this.createHead(actor, input, prepared);
    }

    return this.createMember(actor, input, prepared);
  }

  private async createHead(
    actor: AuthenticatedUser,
    input: CreateHouseholdEnrollmentInput,
    prepared: Awaited<ReturnType<typeof this.prepareEnrollment>>,
  ): Promise<Enrollment> {
    const existingHousehold = await this.households.findByLocalId(
      input.household.householdLocalId,
    );
    if (existingHousehold?.headEnrollmentId) {
      throw new AppError(
        'HOUSEHOLD_HEAD_EXISTS',
        'This household already has a head enrollment',
        409,
      );
    }

    const codeClash = await this.households.findByWardAndCode(
      input.wardId,
      input.household.householdCode.trim(),
    );
    if (codeClash && codeClash.householdLocalId !== input.household.householdLocalId) {
      throw new AppError(
        'HOUSEHOLD_CODE_TAKEN',
        'A household with this code already exists in the ward',
        409,
      );
    }

    const enrollmentId = await this.enrollments.allocateEnrollmentId(
      new Date().getFullYear(),
    );

    try {
      const result = await this.households.createHeadEnrollment({
        household: {
          id: existingHousehold?.id ?? createUuidV7(),
          householdLocalId: input.household.householdLocalId,
          householdCode: input.household.householdCode.trim(),
          wardId: input.wardId,
          residentialAddress:
            optionalCollapsed(input.household.sharedResidentialAddress) ??
            prepared.residentialAddress,
        },
        enrollment: {
          ...prepared.enrollmentData,
          enrollmentId,
          householdRole: 'head',
        },
      });

      await this.recordActivity.execute({
        category: 'enrollment',
        action: 'created',
        summary: `${result.enrollment.firstName} ${result.enrollment.lastName} enrolled as household head by ${actor.name}`,
        wardId: result.enrollment.wardId,
        actorUserId: actor.id,
        enrollmentId: result.enrollment.id,
      });

      return result.enrollment;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'HOUSEHOLD_HEAD_EXISTS'
      ) {
        throw new AppError(
          'HOUSEHOLD_HEAD_EXISTS',
          'This household already has a head enrollment',
          409,
        );
      }
      return this.handleUniqueViolation(error, input.idempotencyId, prepared);
    }
  }

  private async createMember(
    actor: AuthenticatedUser,
    input: CreateHouseholdEnrollmentInput,
    prepared: Awaited<ReturnType<typeof this.prepareEnrollment>>,
  ): Promise<Enrollment> {
    const household = await this.resolveHousehold(input);
    if (!household) {
      throw new AppError('HOUSEHOLD_NOT_FOUND', 'Household not found', 404);
    }
    if (!household.baseEnrollmentId) {
      throw new AppError(
        'HOUSEHOLD_HEAD_NOT_SYNCED',
        'Household head must be synchronized before adding members',
        409,
      );
    }
    if (household.wardId !== input.wardId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Enrollment ward must match the household ward',
        400,
      );
    }

    try {
      const enrollment = await this.households.createMemberEnrollment({
        householdId: household.id,
        enrollment: {
          ...prepared.enrollmentData,
          householdRole: 'member',
        },
      });

      await this.recordActivity.execute({
        category: 'enrollment',
        action: 'created',
        summary: `${enrollment.firstName} ${enrollment.lastName} enrolled as household member by ${actor.name}`,
        wardId: enrollment.wardId,
        actorUserId: actor.id,
        enrollmentId: enrollment.id,
      });

      return enrollment;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'HOUSEHOLD_HEAD_NOT_SYNCED'
      ) {
        throw new AppError(
          'HOUSEHOLD_HEAD_NOT_SYNCED',
          'Household head must be synchronized before adding members',
          409,
        );
      }
      return this.handleUniqueViolation(error, input.idempotencyId, prepared);
    }
  }

  private async resolveHousehold(input: CreateHouseholdEnrollmentInput) {
    if (input.household.householdId) {
      return this.households.findById(input.household.householdId);
    }
    return this.households.findByLocalId(input.household.householdLocalId);
  }

  private async prepareEnrollment(
    actor: AuthenticatedUser,
    input: CreateHouseholdEnrollmentInput,
  ) {
    let dateOfBirth: Date;
    try {
      dateOfBirth = parseIsoDateOnly(input.dateOfBirth);
      assertReasonableDateOfBirth(dateOfBirth);
    } catch (error) {
      throw new AppError(
        'VALIDATION_ERROR',
        error instanceof Error ? error.message : 'Invalid date of birth',
        400,
      );
    }

    const firstName = toTitleCase(input.firstName);
    const lastName = toTitleCase(input.lastName);
    const middleName = input.middleName
      ? toTitleCase(input.middleName)
      : null;
    const firstNameNormalized = normalizeEnrollmentNameKey(firstName);
    const lastNameNormalized = normalizeEnrollmentNameKey(lastName);

    const duplicateCheck = await this.checkDuplicate.execute({
      firstName,
      lastName,
      dateOfBirth: input.dateOfBirth,
    });
    if (duplicateCheck.isDuplicate) {
      throw new AppError(
        'DUPLICATE_ENROLLMENT',
        'An enrollment already exists for this first name, last name, and date of birth',
        409,
        {
          id: duplicateCheck.id,
          enrollmentId: duplicateCheck.enrollmentId,
        },
      );
    }

    const ward = await this.wards.findById(input.wardId);
    if (!ward) {
      throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
    }

    if (actor.role === 'field_worker') {
      const user = await this.users.findById(actor.id);
      if (
        !fieldWorkerCanAccessWard(user?.assignedWards ?? [], input.wardId)
      ) {
        throw new AppError(
          'FORBIDDEN_WARD',
          'Field workers can only enroll beneficiaries in their assigned wards',
          403,
        );
      }
    }

    const facility = await this.facilities.findById(input.healthFacilityId);
    if (!facility) {
      throw new AppError(
        'HEALTH_FACILITY_NOT_FOUND',
        'Health facility not found',
        404,
      );
    }
    if (facility.wardId !== input.wardId) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Health facility does not belong to the selected ward',
        400,
      );
    }

    const passportExists = await this.storage.exists(input.passportObjectKey);
    const idDocExists = await this.storage.exists(input.idDocumentObjectKey);
    if (!passportExists || !idDocExists) {
      throw new AppError(
        'UPLOAD_NOT_FOUND',
        'Passport and ID document uploads are required before enrollment',
        400,
      );
    }

    const passportPrintObjectKey = await this.passportPrint.ensureStored(
      input.passportObjectKey,
    );

    let capturedAt: Date | null = null;
    if (input.capturedAt) {
      const parsed = new Date(input.capturedAt);
      if (Number.isNaN(parsed.getTime())) {
        throw new AppError(
          'VALIDATION_ERROR',
          'capturedAt must be a valid ISO datetime',
          400,
        );
      }
      capturedAt = parsed;
    }

    const residentialAddress = collapseAddress(input.residentialAddress);

    return {
      residentialAddress,
      enrollmentData: {
        id: createUuidV7(),
        idempotencyId: input.idempotencyId,
        capturedAt,
        status: 'pending' as const,
        category: collapseAddress(input.category),
        enrolledByUserId: actor.id,
        wardId: input.wardId,
        healthFacilityId: input.healthFacilityId,
        passportObjectKey: input.passportObjectKey,
        passportPrintObjectKey,
        idDocumentObjectKey: input.idDocumentObjectKey,
        title: input.title,
        gender: input.gender,
        firstName,
        lastName,
        middleName,
        firstNameNormalized,
        lastNameNormalized,
        dateOfBirth,
        phone: input.phone.trim(),
        email: input.email?.trim().toLowerCase() || null,
        nin: input.nin?.trim() || null,
        maritalStatus: input.maritalStatus,
        bloodGroup: input.bloodGroup ?? null,
        genotype: input.genotype ?? null,
        idType: input.idType,
        emergencyPhone: optionalTrimmed(input.emergencyPhone),
        stateOfResidence: normalizePlaceName(
          input.stateOfResidence ?? 'Plateau',
        ),
        lgaOfResidence: normalizePlaceName(input.lgaOfResidence),
        residentialAddress,
      },
    };
  }

  private async handleUniqueViolation(
    error: unknown,
    idempotencyId: string,
    prepared: Awaited<ReturnType<typeof this.prepareEnrollment>>,
  ): Promise<Enrollment> {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: unknown }).code)
        : '';

    if (code !== 'P2002') {
      throw error;
    }

    const replay = await this.enrollments.findByIdempotencyId(idempotencyId);
    if (replay) {
      return { ...replay, idempotentReplay: true };
    }

    const identityReplay = await this.enrollments.findByIdentityKey({
      firstNameNormalized: prepared.enrollmentData.firstNameNormalized,
      lastNameNormalized: prepared.enrollmentData.lastNameNormalized,
      dateOfBirth: prepared.enrollmentData.dateOfBirth,
    });
    if (identityReplay) {
      throw new AppError(
        'DUPLICATE_ENROLLMENT',
        'An enrollment already exists for this first name, last name, and date of birth',
        409,
        {
          id: identityReplay.id,
          enrollmentId: identityReplay.enrollmentId,
        },
      );
    }

    throw error;
  }
}

function collapseAddress(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function optionalTrimmed(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalCollapsed(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? collapseAddress(trimmed) : null;
}
