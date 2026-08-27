import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
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
    description: 'Ward IDs assigned to a field worker',
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

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  assignedWardIds?: string[];
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ enum: ['admin', 'field_worker'] })
  @IsOptional()
  @IsEnum(['admin', 'field_worker'])
  role?: 'admin' | 'field_worker';

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}

export class UserWardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  lga!: string;
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

  @ApiProperty({ type: [UserWardResponseDto] })
  assignedWards!: UserWardResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
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
