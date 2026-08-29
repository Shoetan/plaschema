import { Inject, Injectable } from '@nestjs/common';
import { AppError } from '../../../platform/http/app-error';
import {
  assertReasonableDateOfBirth,
  normalizeEnrollmentNameKey,
  parseIsoDateOnly,
} from '../domain/enrollment-identity';
import {
  ENROLLMENT_REPOSITORY,
  type EnrollmentRepository,
} from './enrollment.repository';

@Injectable()
export class CheckEnrollmentDuplicateUseCase {
  constructor(
    @Inject(ENROLLMENT_REPOSITORY)
    private readonly enrollments: EnrollmentRepository,
  ) {}

  async execute(input: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  }) {
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

    const existing = await this.enrollments.findByIdentityKey({
      firstNameNormalized: normalizeEnrollmentNameKey(input.firstName),
      lastNameNormalized: normalizeEnrollmentNameKey(input.lastName),
      dateOfBirth,
    });

    return {
      isDuplicate: Boolean(existing),
      id: existing?.id ?? null,
      enrollmentId: existing?.enrollmentId ?? null,
    };
  }
}
