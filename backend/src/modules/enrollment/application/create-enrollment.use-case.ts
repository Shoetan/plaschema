import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { createUuidV7, isUuidV7 } from '../../../platform/ids/uuid-v7';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../platform/storage/object-storage';
import { normalizePlaceName, toTitleCase } from '../../../shared/text';
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
import type { Enrollment } from '../domain/enrollment';
import {
  assertReasonableDateOfBirth,
  normalizeEnrollmentNameKey,
  parseIsoDateOnly,
} from '../domain/enrollment-identity';
import { CheckEnrollmentDuplicateUseCase } from './check-enrollment-duplicate.use-case';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from './enrollment.repository';
import { fieldWorkerCanAccessWard } from './field-worker-ward-access';
import { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';

export type CreateEnrollmentInput = {
  /** Required offline idempotency key (UUID v7). */
  idempotencyId: string;
  capturedAt?: string | null;
  /** Beneficiary category label shown in admin tables. */
  category: string;
  passportObjectKey: string;
  idDocumentObjectKey: string;
  title: Enrollment['title'];
  gender: Enrollment['gender'];
  firstName: string;
  lastName: string;
  middleName?: string | null;
  dateOfBirth: string;
  phone: string;
  email?: string | null;
  nin?: string | null;
  maritalStatus: Enrollment['maritalStatus'];
  bloodGroup?: Enrollment['bloodGroup'];
  genotype?: Enrollment['genotype'];
  idType: Enrollment['idType'];
  nextOfKinFullName?: string | null;
  emergencyPhone?: string | null;
  nextOfKinRelationship?: Enrollment['nextOfKinRelationship'];
  stateOfResidence?: string;
  lgaOfResidence: string;
  residentialAddress: string;
  wardId: string;
  healthFacilityId: string;
};

@Injectable()
export class CreateEnrollmentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    private readonly checkDuplicate: CheckEnrollmentDuplicateUseCase,
    private readonly recordActivity: RecordActivityUseCase,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    input: CreateEnrollmentInput,
  ): Promise<Enrollment> {
    if (!isUuidV7(input.idempotencyId)) {
      throw new AppError(
        'VALIDATION_ERROR',
        'idempotencyId must be a UUID v7',
        400,
      );
    }

    const existingByIdempotency = await this.enrollments.findByIdempotencyId(
      input.idempotencyId,
    );
    if (existingByIdempotency) {
      return { ...existingByIdempotency, idempotentReplay: true };
    }

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

    try {
      const enrollmentId = await this.enrollments.allocateEnrollmentId(
        new Date().getFullYear(),
      );

      return await this.enrollments.create({
        id: createUuidV7(),
        enrollmentId,
        idempotencyId: input.idempotencyId,
        capturedAt,
        status: 'pending',
        category: collapseAddress(input.category),
        enrolledByUserId: actor.id,
        wardId: input.wardId,
        healthFacilityId: input.healthFacilityId,
        passportObjectKey: input.passportObjectKey,
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
        nextOfKinFullName: optionalTrimmedTitle(input.nextOfKinFullName),
        emergencyPhone: optionalTrimmed(input.emergencyPhone),
        nextOfKinRelationship: input.nextOfKinRelationship ?? null,
        stateOfResidence: normalizePlaceName(
          input.stateOfResidence ?? 'Plateau',
        ),
        lgaOfResidence: normalizePlaceName(input.lgaOfResidence),
        residentialAddress: collapseAddress(input.residentialAddress),
      }).then(async (enrollment) => {
        await this.recordActivity.execute({
          category: 'enrollment',
          action: 'created',
          summary: `${enrollment.firstName} ${enrollment.lastName} enrolled by ${actor.name}`,
          wardId: enrollment.wardId,
          actorUserId: actor.id,
          enrollmentId: enrollment.id,
        });
        return enrollment;
      });
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';

      if (code === 'P2002') {
        const replay = await this.enrollments.findByIdempotencyId(
          input.idempotencyId,
        );
        if (replay) {
          return { ...replay, idempotentReplay: true };
        }

        const identityReplay = await this.enrollments.findByIdentityKey({
          firstNameNormalized,
          lastNameNormalized,
          dateOfBirth,
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
      }

      throw error;
    }
  }
}

function collapseAddress(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function optionalTrimmed(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function optionalTrimmedTitle(value: string | null | undefined): string | null {
  const trimmed = optionalTrimmed(value);
  return trimmed ? toTitleCase(trimmed) : null;
}
