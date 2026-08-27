import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CursorPaginationMetaDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Pass as cursor on the next request; null when no more pages',
  })
  nextCursor!: string | null;

  @ApiProperty()
  hasMore!: boolean;

  @ApiProperty()
  limit!: number;
}
