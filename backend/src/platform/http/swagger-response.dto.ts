import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;
}

export class ApiErrorBodyDto {
  @ApiProperty({ example: 'USER_NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'User not found' })
  message!: string;

  @ApiPropertyOptional({ nullable: true, example: null })
  details!: unknown;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;
}
