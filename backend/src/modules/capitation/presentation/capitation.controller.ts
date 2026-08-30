import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../platform/auth/current-user.decorator';
import { Roles } from '../../../platform/auth/roles.decorator';
import { GenerateCapitationUseCase } from '../application/generate-capitation.use-case';
import { ListCapitationsUseCase } from '../application/list-capitations.use-case';
import { PreviewCapitationUseCase } from '../application/preview-capitation.use-case';
import {
  CapitationGenerateResponseDto,
  CapitationPeriodQueryDto,
  CapitationPreviewResponseDto,
  GenerateCapitationDto,
  ListCapitationsQueryDto,
  ListCapitationsResponseDto,
} from './capitation.dto';

@ApiTags('capitations')
@ApiBearerAuth('bearer')
@Controller('capitations')
export class CapitationController {
  constructor(
    private readonly previewCapitation: PreviewCapitationUseCase,
    private readonly generateCapitation: GenerateCapitationUseCase,
    private readonly listCapitations: ListCapitationsUseCase,
  ) {}

  @Get('preview')
  @Roles('admin')
  @ApiOperation({
    summary: 'Preview capitation for all active facilities before generating',
  })
  @ApiOkResponse({ type: CapitationPreviewResponseDto })
  preview(@Query() query: CapitationPeriodQueryDto) {
    return this.previewCapitation.execute(query);
  }

  @Post('generate')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Generate capitation for all active facilities and active enrollments',
  })
  @ApiCreatedResponse({ type: CapitationGenerateResponseDto })
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: GenerateCapitationDto,
  ) {
    return this.generateCapitation.execute(user, body);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary:
      'List capitation records from the latest run for a month/year (defaults to current Lagos period)',
  })
  @ApiOkResponse({ type: ListCapitationsResponseDto })
  list(@Query() query: ListCapitationsQueryDto) {
    return this.listCapitations.execute(query);
  }
}
