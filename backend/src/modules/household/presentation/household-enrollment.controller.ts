import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../platform/auth/roles.decorator';
import { CurrentUser } from '../../../platform/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { CreateHouseholdEnrollmentUseCase } from '../application/create-household-enrollment.use-case';
import type { Enrollment } from '../../enrollment/domain/enrollment';
import {
  CreateHouseholdEnrollmentDto,
  CreateHouseholdEnrollmentResponseDto,
} from './household.dto';

function toHouseholdEnrollmentResponse(
  enrollment: Enrollment,
): CreateHouseholdEnrollmentResponseDto {
  return {
    id: enrollment.id,
    enrollmentId: enrollment.enrollmentId,
    idempotencyId: enrollment.idempotencyId,
    status: enrollment.status,
    capturedAt: enrollment.capturedAt,
    createdAt: enrollment.createdAt,
    idempotentReplay: enrollment.idempotentReplay ?? false,
    householdId: enrollment.householdId,
    householdRole: enrollment.householdRole,
    memberSequence: enrollment.memberSequence,
    householdCode: enrollment.household?.householdCode ?? null,
  };
}

@ApiTags('household-enrollments')
@ApiBearerAuth('bearer')
@Controller('household-enrollments')
export class HouseholdEnrollmentController {
  constructor(
    private readonly createHouseholdEnrollment: CreateHouseholdEnrollmentUseCase,
  ) {}

  @Post()
  @Roles('admin', 'field_worker')
  @ApiOperation({
    summary:
      'Create a household head or member enrollment (server assigns member sequence and insurance ID suffix)',
  })
  @ApiCreatedResponse({ type: CreateHouseholdEnrollmentResponseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateHouseholdEnrollmentDto,
  ) {
    const enrollment = await this.createHouseholdEnrollment.execute(user, {
      ...body,
      household: body.household,
    });
    return toHouseholdEnrollmentResponse(enrollment);
  }
}
