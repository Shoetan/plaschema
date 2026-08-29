import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
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
} from 'class-validator';
import {
  EmptyStringToUndefined,
  toQueryInt,
} from '../../../platform/http/query-transforms';

export class ResetPasswordDto {
  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@cbhi.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Admin' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'jane@cbhi.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: ['admin', 'field_worker'] })
  @IsEnum(['admin', 'field_worker'])
  role!: 'admin' | 'field_worker';

  @ApiPropertyOptional({
    example: '+2348012345678',
    description: 'Required for field_worker; optional for admin',
  })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  phone?: string | null;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Ward IDs assigned to a field worker. Empty/omitted means access to all wards.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  assignedWardIds?: string[];

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Jane Admin' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: '+2348012345678', nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(32)
  phone?: string | null;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ example: 'NewPassword123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description:
      'Ward IDs assigned to a field worker. Empty array means access to all wards.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  assignedWardIds?: string[];
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Cursor from the previous page nextCursor',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsUUID('7')
  cursor?: string;

  @ApiPropertyOptional({
    type: Number,
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @Transform(({ value }) => toQueryInt(value, 50, { min: 1, max: 100 }))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @ApiPropertyOptional({ enum: ['admin', 'field_worker'] })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(['admin', 'field_worker'])
  role?: 'admin' | 'field_worker';

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    type: String,
    example: 'Amina',
    description: 'Search by name, email, or phone',
  })
  @EmptyStringToUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  search?: string;
}

export class UserWardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;
}

export class FieldWorkerListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Amina Yusuf' })
  name!: string;

  @ApiPropertyOptional({ example: '+2348034567890', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: 'amina.yusuf@plaschema.ng' })
  email!: string;

  @ApiProperty({
    type: [UserWardResponseDto],
    description:
      'Assigned wards (replaces community). Empty array means access to all wards.',
  })
  wards!: UserWardResponseDto[];

  @ApiProperty({ example: 156 })
  beneficiariesEnrolled!: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ISO datetime of the worker’s most recent enrollment',
  })
  lastEnrollmentAt!: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'ISO datetime of the last reported device/app sync',
  })
  lastSyncedAt!: Date | null;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: 'active' | 'inactive';
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['admin', 'field_worker'] })
  role!: 'admin' | 'field_worker';

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: 'active' | 'inactive';

  @ApiPropertyOptional({ nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  lastSyncedAt!: Date | null;

  @ApiProperty({ type: [UserWardResponseDto] })
  assignedWards!: UserWardResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class FieldWorkerDetailOverviewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: ['active', 'inactive'] })
  status!: 'active' | 'inactive';

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class FieldWorkerDetailStatsDto {
  @ApiProperty({ example: 156 })
  totalEnrolled!: number;

  @ApiProperty({ example: 31 })
  enrollmentsThisMonth!: number;

  @ApiProperty({ nullable: true })
  lastEnrollmentAt!: Date | null;

  @ApiProperty({ nullable: true })
  lastSyncedAt!: Date | null;
}

export class FieldWorkerDetailWardDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;

  @ApiProperty({ example: 'Plateau' })
  state!: 'Plateau';
}

export class FieldWorkerDetailActivityLogActorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;
}

export class FieldWorkerDetailActivityLogEntryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['enrollment', 'ward', 'user', 'sync'] })
  category!: string;

  @ApiProperty({
    enum: ['created', 'updated', 'status_changed', 'printed', 'assigned'],
  })
  action!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty({ nullable: true, type: FieldWorkerDetailActivityLogActorDto })
  actor!: FieldWorkerDetailActivityLogActorDto | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  enrollmentId!: string | null;

  @ApiProperty()
  occurredAt!: Date;
}

export class FieldWorkerDetailResponseDto {
  @ApiProperty({ type: FieldWorkerDetailOverviewDto })
  fieldWorker!: FieldWorkerDetailOverviewDto;

  @ApiProperty({ type: FieldWorkerDetailStatsDto })
  stats!: FieldWorkerDetailStatsDto;

  @ApiProperty({ type: FieldWorkerDetailWardDto, isArray: true })
  wards!: FieldWorkerDetailWardDto[];

  @ApiProperty({
    type: FieldWorkerDetailActivityLogEntryDto,
    isArray: true,
    description:
      'Unified activity feed for Enrollment Activity and Sync Activity tabs',
  })
  activityLog!: FieldWorkerDetailActivityLogEntryDto[];
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ example: '8h' })
  expiresIn!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
