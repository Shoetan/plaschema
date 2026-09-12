import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  EmptyStringToUndefined,
  toQueryInt,
} from '../../../platform/http/query-transforms';
import { CreateEnrollmentDto } from '../../enrollment/presentation/enrollment.dto';
import { HOUSEHOLD_ROLES, type HouseholdRole } from '../domain/household';

export class HouseholdEnrollmentContextDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Client-generated household session id (UUID v7)',
  })
  @IsUUID('7')
  householdLocalId!: string;

  @ApiProperty({ example: 'JOS-VOM-001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(64)
  householdCode!: string;

  @ApiProperty({ enum: HOUSEHOLD_ROLES })
  @IsEnum(HOUSEHOLD_ROLES)
  role!: HouseholdRole;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Server household id for late member addition',
  })
  @IsOptional()
  @IsUUID('7')
  householdId?: string;

  @ApiPropertyOptional({
    example: 'Settlement Road, Vom',
    description: 'Shared settlement address stored on the household (head create)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  sharedResidentialAddress?: string;
}

export class CreateHouseholdEnrollmentDto extends CreateEnrollmentDto {
  @ApiProperty({ type: HouseholdEnrollmentContextDto })
  @ValidateNested()
  @Type(() => HouseholdEnrollmentContextDto)
  household!: HouseholdEnrollmentContextDto;
}

export class CreateHouseholdEnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PL/CBHI/2026/010-01' })
  enrollmentId!: string;

  @ApiProperty({ format: 'uuid' })
  idempotencyId!: string;

  @ApiProperty({ example: 'pending' })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  capturedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  idempotentReplay!: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Server household id',
  })
  householdId!: string | null;

  @ApiPropertyOptional({ enum: HOUSEHOLD_ROLES, nullable: true })
  householdRole!: HouseholdRole | null;

  @ApiPropertyOptional({
    example: 2,
    nullable: true,
    description: 'Assigned by the server for household members',
  })
  memberSequence!: number | null;

  @ApiPropertyOptional({ example: 'JOS-VOM-001', nullable: true })
  householdCode!: string | null;
}

export class ListHouseholdsQueryDto {
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  cursor?: string;

  @TransformQueryLimit()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  wardId?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lga?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  householdCode?: string;
}

function TransformQueryLimit() {
  return Transform(({ value }) => toQueryInt(value, 50, { min: 1, max: 100 }));
}

export class HouseholdWardDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty({ example: 'JOS-VOM' })
  code!: string;
}

export class HouseholdListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  householdLocalId!: string;

  @ApiProperty({ example: 'JOS-VOM-001' })
  householdCode!: string;

  @ApiProperty({ format: 'uuid' })
  wardId!: string;

  @ApiProperty({ type: HouseholdWardDto })
  ward!: HouseholdWardDto;

  @ApiProperty({ nullable: true, example: 'Musa Ibrahim' })
  headName!: string | null;

  @ApiProperty({ example: 3 })
  memberCount!: number;

  @ApiProperty({ nullable: true })
  residentialAddress!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class HouseholdMemberSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  enrollmentId!: string;

  @ApiProperty({ enum: HOUSEHOLD_ROLES })
  householdRole!: HouseholdRole;

  @ApiProperty({ nullable: true, example: 2 })
  memberSequence!: number | null;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  status!: string;
}

export class HouseholdCodeCounterDto {
  @ApiProperty({ format: 'uuid' })
  wardId!: string;

  @ApiProperty({
    nullable: true,
    example: '001',
    description:
      'Highest household code suffix for the ward, or null when no households exist yet',
  })
  lastSuffix!: string | null;
}

export class HouseholdCodeCountersResponseDto {
  @ApiProperty({ type: HouseholdCodeCounterDto, isArray: true })
  data!: HouseholdCodeCounterDto[];
}

export class HouseholdDetailResponseDto {
  @ApiProperty()
  household!: {
    id: string;
    householdLocalId: string;
    householdCode: string;
    wardId: string;
    headEnrollmentId: string | null;
    baseEnrollmentId: string | null;
    residentialAddress: string | null;
    memberCount: number;
    createdAt: Date;
    updatedAt: Date;
    ward: HouseholdWardDto;
  };

  @ApiProperty({ type: HouseholdMemberSummaryDto, nullable: true })
  head!: HouseholdMemberSummaryDto | null;

  @ApiProperty({ type: HouseholdMemberSummaryDto, isArray: true })
  members!: HouseholdMemberSummaryDto[];
}
