import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../platform/auth/roles.decorator';
import { GetDashboardUseCase } from '../application/get-dashboard.use-case';
import { DashboardQueryDto, DashboardResponseDto } from './dashboard.dto';

@ApiTags('dashboard')
@ApiBearerAuth('bearer')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getDashboard: GetDashboardUseCase) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Admin programme dashboard overview',
    description:
      'Single aggregate for KPI cards, enrollment trend, breakdowns, geo rankings, and preview tables. No state filter (Plateau only).',
  })
  @ApiOkResponse({ type: DashboardResponseDto })
  get(@Query() query: DashboardQueryDto): Promise<DashboardResponseDto> {
    return this.getDashboard.execute({
      lga: query.lga,
      wardId: query.wardId,
      period: query.period ?? '30d',
      trend: query.trend ?? 'monthly',
    });
  }
}
