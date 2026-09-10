import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { AppError } from '../../../platform/http/app-error';
import { normalizePlaceName, toTitleCase } from '../../../shared/text';
import {
  HEALTH_FACILITY_REPOSITORY,
  type HealthFacilityRepository,
} from '../../health-facility/application/health-facility.repository';
import {
  WARD_REPOSITORY,
  type WardRepository,
} from '../../ward/application/ward.repository';
import { RecordActivityUseCase } from '../../activity-log/application/record-activity.use-case';
import type { Enrollment } from '../domain/enrollment';
import { enrollmentBeneficiaryName } from '../domain/enrollment-id';
import {
  assertReasonableDateOfBirth,
  formatIsoDateOnly,
  normalizeEnrollmentNameKey,
  parseIsoDateOnly,
} from '../domain/enrollment-identity';
import { AttachEnrollmentFileUrls } from './attach-enrollment-file-urls';
import { CheckEnrollmentDuplicateUseCase } from './check-enrollment-duplicate.use-case';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
  type UpdateEnrollmentRecordInput,
} from './enrollment.repository';

export type UpdateEnrollmentProfileInput = {
  category?: string;
  title?: Enrollment['title'];
  gender?: Enrollment['gender'];
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  dateOfBirth?: string;
  phone?: string;
  email?: string | null;
  nin?: string | null;
  maritalStatus?: Enrollment['maritalStatus'];
  bloodGroup?: Enrollment['bloodGroup'] | null;
  genotype?: Enrollment['genotype'] | null;
  idType?: Enrollment['idType'];
  emergencyPhone?: string | null;
  stateOfResidence?: string;
  lgaOfResidence?: string;
  residentialAddress?: string;
  wardId?: string;
  healthFacilityId?: string;
};

const PROFILE_FIELD_LABELS: Record<keyof UpdateEnrollmentProfileInput, string> = {
  category: 'category',
  title: 'title',
  gender: 'gender',
  firstName: 'first name',
  lastName: 'last name',
  middleName: 'middle name',
  dateOfBirth: 'date of birth',
  phone: 'phone',
  email: 'email',
  nin: 'NIN',
  maritalStatus: 'marital status',
  bloodGroup: 'blood group',
  genotype: 'genotype',
  idType: 'ID document type',
  emergencyPhone: 'emergency contact',
  stateOfResidence: 'state of residence',
  lgaOfResidence: 'LGA of residence',
  residentialAddress: 'residential address',
  wardId: 'ward',
  healthFacilityId: 'health facility',
};

@Injectable()
export class UpdateEnrollmentUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
    @Inject(WARD_REPOSITORY) private readonly wards: WardRepository,
    @Inject(HEALTH_FACILITY_REPOSITORY)
    private readonly facilities: HealthFacilityRepository,
    private readonly checkDuplicate: CheckEnrollmentDuplicateUseCase,
    private readonly recordActivity: RecordActivityUseCase,
    private readonly attachFileUrls: AttachEnrollmentFileUrls,
  ) {}

  async execute(
    actor: AuthenticatedUser,
    id: string,
    input: UpdateEnrollmentProfileInput,
  ) {
    const existing = await this.enrollments.findById(id);
    if (!existing) {
      throw new AppError('ENROLLMENT_NOT_FOUND', 'Enrollment not found', 404);
    }

    const providedKeys = (
      Object.keys(input) as Array<keyof UpdateEnrollmentProfileInput>
    ).filter((key) => input[key] !== undefined);

    if (providedKeys.length === 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        'At least one beneficiary field must be provided',
        400,
      );
    }

    const patch: UpdateEnrollmentRecordInput = {};
    const changedFields: string[] = [];

    if (input.category !== undefined) {
      const category = collapseAddress(input.category);
      if (category !== existing.category) {
        patch.category = category;
        changedFields.push(PROFILE_FIELD_LABELS.category);
      }
    }

    if (input.title !== undefined && input.title !== existing.title) {
      patch.title = input.title;
      changedFields.push(PROFILE_FIELD_LABELS.title);
    }

    if (input.gender !== undefined && input.gender !== existing.gender) {
      patch.gender = input.gender;
      changedFields.push(PROFILE_FIELD_LABELS.gender);
    }

    let nextFirstName = existing.firstName;
    let nextLastName = existing.lastName;
    let nextMiddleName = existing.middleName;
    let nextDateOfBirth = existing.dateOfBirth;

    if (input.firstName !== undefined) {
      nextFirstName = toTitleCase(input.firstName);
      if (nextFirstName !== existing.firstName) {
        patch.firstName = nextFirstName;
        patch.firstNameNormalized = normalizeEnrollmentNameKey(nextFirstName);
        changedFields.push(PROFILE_FIELD_LABELS.firstName);
      }
    }

    if (input.lastName !== undefined) {
      nextLastName = toTitleCase(input.lastName);
      if (nextLastName !== existing.lastName) {
        patch.lastName = nextLastName;
        patch.lastNameNormalized = normalizeEnrollmentNameKey(nextLastName);
        changedFields.push(PROFILE_FIELD_LABELS.lastName);
      }
    }

    if (input.middleName !== undefined) {
      nextMiddleName = input.middleName
        ? toTitleCase(input.middleName)
        : null;
      if (nextMiddleName !== existing.middleName) {
        patch.middleName = nextMiddleName;
        changedFields.push(PROFILE_FIELD_LABELS.middleName);
      }
    }

    if (input.dateOfBirth !== undefined) {
      let parsed: Date;
      try {
        parsed = parseIsoDateOnly(input.dateOfBirth);
        assertReasonableDateOfBirth(parsed);
      } catch (error) {
        throw new AppError(
          'VALIDATION_ERROR',
          error instanceof Error ? error.message : 'Invalid date of birth',
          400,
        );
      }
      nextDateOfBirth = formatIsoDateOnly(parsed);
      if (nextDateOfBirth !== existing.dateOfBirth) {
        patch.dateOfBirth = parsed;
        changedFields.push(PROFILE_FIELD_LABELS.dateOfBirth);
      }
    }

    const identityChanged =
      patch.firstName !== undefined
      || patch.lastName !== undefined
      || patch.dateOfBirth !== undefined;

    if (identityChanged) {
      const duplicateCheck = await this.checkDuplicate.execute({
        firstName: nextFirstName,
        lastName: nextLastName,
        dateOfBirth: nextDateOfBirth,
        excludeId: id,
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
    }

    if (input.phone !== undefined) {
      const phone = input.phone.trim();
      if (phone !== existing.phone) {
        patch.phone = phone;
        changedFields.push(PROFILE_FIELD_LABELS.phone);
      }
    }

    if (input.email !== undefined) {
      const email = input.email?.trim().toLowerCase() || null;
      if (email !== existing.email) {
        patch.email = email;
        changedFields.push(PROFILE_FIELD_LABELS.email);
      }
    }

    if (input.nin !== undefined) {
      const nin = input.nin?.trim() || null;
      if (nin !== existing.nin) {
        patch.nin = nin;
        changedFields.push(PROFILE_FIELD_LABELS.nin);
      }
    }

    if (
      input.maritalStatus !== undefined
      && input.maritalStatus !== existing.maritalStatus
    ) {
      patch.maritalStatus = input.maritalStatus;
      changedFields.push(PROFILE_FIELD_LABELS.maritalStatus);
    }

    if (input.bloodGroup !== undefined) {
      const bloodGroup = input.bloodGroup ?? null;
      if (bloodGroup !== existing.bloodGroup) {
        patch.bloodGroup = bloodGroup;
        changedFields.push(PROFILE_FIELD_LABELS.bloodGroup);
      }
    }

    if (input.genotype !== undefined) {
      const genotype = input.genotype ?? null;
      if (genotype !== existing.genotype) {
        patch.genotype = genotype;
        changedFields.push(PROFILE_FIELD_LABELS.genotype);
      }
    }

    if (input.idType !== undefined && input.idType !== existing.idType) {
      patch.idType = input.idType;
      changedFields.push(PROFILE_FIELD_LABELS.idType);
    }

    if (input.emergencyPhone !== undefined) {
      const emergencyPhone = optionalTrimmed(input.emergencyPhone);
      if (emergencyPhone !== existing.emergencyPhone) {
        patch.emergencyPhone = emergencyPhone;
        changedFields.push(PROFILE_FIELD_LABELS.emergencyPhone);
      }
    }

    if (input.stateOfResidence !== undefined) {
      const stateOfResidence = normalizePlaceName(input.stateOfResidence);
      if (stateOfResidence !== existing.stateOfResidence) {
        patch.stateOfResidence = stateOfResidence;
        changedFields.push(PROFILE_FIELD_LABELS.stateOfResidence);
      }
    }

    if (input.lgaOfResidence !== undefined) {
      const lgaOfResidence = normalizePlaceName(input.lgaOfResidence);
      if (lgaOfResidence !== existing.lgaOfResidence) {
        patch.lgaOfResidence = lgaOfResidence;
        changedFields.push(PROFILE_FIELD_LABELS.lgaOfResidence);
      }
    }

    if (input.residentialAddress !== undefined) {
      const residentialAddress = collapseAddress(input.residentialAddress);
      if (residentialAddress !== existing.residentialAddress) {
        patch.residentialAddress = residentialAddress;
        changedFields.push(PROFILE_FIELD_LABELS.residentialAddress);
      }
    }

    const nextWardId = input.wardId ?? existing.wardId;
    const nextFacilityId = input.healthFacilityId ?? existing.healthFacilityId;

    if (input.wardId !== undefined && input.wardId !== existing.wardId) {
      const ward = await this.wards.findById(input.wardId);
      if (!ward) {
        throw new AppError('WARD_NOT_FOUND', 'Ward not found', 404);
      }
      patch.wardId = input.wardId;
      changedFields.push(PROFILE_FIELD_LABELS.wardId);
    }

    if (
      input.healthFacilityId !== undefined
      && input.healthFacilityId !== existing.healthFacilityId
    ) {
      patch.healthFacilityId = input.healthFacilityId;
      changedFields.push(PROFILE_FIELD_LABELS.healthFacilityId);
    }

    if (
      input.wardId !== undefined
      || input.healthFacilityId !== undefined
    ) {
      const facility = await this.facilities.findById(nextFacilityId);
      if (!facility) {
        throw new AppError(
          'HEALTH_FACILITY_NOT_FOUND',
          'Health facility not found',
          404,
        );
      }
      if (facility.wardId !== nextWardId) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Health facility does not belong to the selected ward',
          400,
        );
      }
    }

    if (changedFields.length === 0) {
      return this.attachFileUrls.forOne(existing);
    }

    const updated = await this.enrollments.update(id, patch);

    await this.recordActivity.execute({
      category: 'enrollment',
      action: 'updated',
      summary: `${enrollmentBeneficiaryName(updated)} updated by ${actor.name} (${changedFields.join(', ')})`,
      wardId: updated.wardId,
      actorUserId: actor.id,
      enrollmentId: updated.id,
      metadata: { changedFields },
    });

    return this.attachFileUrls.forOne(updated);
  }
}

function collapseAddress(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function optionalTrimmed(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
