import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../platform/auth/roles.decorator';
import { CurrentUser } from '../../../platform/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../../platform/auth/current-user.decorator';
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { GetHouseholdCodeCountersUseCase } from '../application/get-household-code-counters.use-case';
import { GetHouseholdUseCase } from '../application/get-household.use-case';
import { ListHouseholdsUseCase } from '../application/list-households.use-case';
import {
  HouseholdCodeCountersResponseDto,
  HouseholdDetailResponseDto,
  HouseholdListItemDto,
  ListHouseholdsQueryDto,
} from './household.dto';

@ApiTags('households')
@ApiBearerAuth('bearer')
@Controller('households')
export class HouseholdController {
  constructor(
    private readonly listHouseholds: ListHouseholdsUseCase,
    private readonly getHouseholdCodeCounters: GetHouseholdCodeCountersUseCase,
    private readonly getHousehold: GetHouseholdUseCase,
  ) {}

  @Get()
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'List households (cursor pagination)' })
  @ApiOkResponse({ type: HouseholdListItemDto, isArray: true })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListHouseholdsQueryDto,
  ) {
    const result = await this.listHouseholds.execute(user, query);
    return {
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: result.limit,
        total: result.total,
      } satisfies CursorPaginationMetaDto,
    };
  }

  @Get('code-counters')
  @Roles('field_worker')
  @ApiOperation({
    summary:
      'Get the highest household code suffix per assigned ward for offline counter sync',
  })
  @ApiOkResponse({ type: HouseholdCodeCountersResponseDto })
  async codeCounters(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.getHouseholdCodeCounters.execute(user);
    return { data };
  }

  @Get(':id')
  @Roles('admin', 'field_worker')
  @ApiOperation({ summary: 'Get household detail with members' })
  @ApiOkResponse({ type: HouseholdDetailResponseDto })
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', UuidV7Pipe) id: string,
  ) {
    return this.getHousehold.execute(user, id);
  }
}
