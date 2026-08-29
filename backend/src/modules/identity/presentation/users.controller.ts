import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../../../platform/auth/roles.decorator';
import { CursorPaginationMetaDto } from '../../../platform/http/cursor-pagination.dto';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { GetFieldWorkerDetailUseCase } from '../application/get-field-worker-detail.use-case';
import { GetUserUseCase } from '../application/get-user.use-case';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import {
  CreateUserDto,
  FieldWorkerDetailResponseDto,
  FieldWorkerListItemDto,
  ListUsersQueryDto,
  ResetPasswordDto,
  UpdateUserDto,
  UserResponseDto,
} from './identity.dto';

@ApiTags('users')
@ApiBearerAuth('bearer')
@ApiExtraModels(UserResponseDto, FieldWorkerListItemDto)
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly getFieldWorkerDetail: GetFieldWorkerDetailUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an admin or field worker' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() body: CreateUserDto) {
    return this.createUser.execute(body);
  }

  @Get()
  @ApiOperation({
    summary:
      'List users (cursor pagination). With role=field_worker returns field-worker table rows (wards, enrollment stats).',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Opaque cursor from meta.nextCursor',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Page size (1-100)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['admin', 'field_worker'],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name, email, or phone',
  })
  @ApiOkResponse({
    description:
      'UserResponseDto[] by default; FieldWorkerListItemDto[] when role=field_worker',
    schema: {
      oneOf: [
        {
          type: 'array',
          items: { $ref: getSchemaPath(UserResponseDto) },
        },
        {
          type: 'array',
          items: { $ref: getSchemaPath(FieldWorkerListItemDto) },
        },
      ],
    },
  })
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsers.execute(query);
    return {
      data: result.items,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: result.limit,
      } satisfies CursorPaginationMetaDto,
    };
  }

  @Get(':id/detail')
  @ApiOperation({
    summary: 'Get field worker detail (admin overview, wards, activity log)',
  })
  @ApiOkResponse({ type: FieldWorkerDetailResponseDto })
  detail(@Param('id', UuidV7Pipe) id: string) {
    return this.getFieldWorkerDetail.execute(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({ type: UserResponseDto })
  get(@Param('id', UuidV7Pipe) id: string) {
    return this.getUser.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id', UuidV7Pipe) id: string, @Body() body: UpdateUserDto) {
    return this.updateUser.execute(id, body);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset a user password (admin only; no email flow)',
  })
  @ApiOkResponse({ description: 'Password reset successfully' })
  resetUserPassword(
    @Param('id', UuidV7Pipe) id: string,
    @Body() body: ResetPasswordDto,
  ) {
    return this.resetPassword.execute(id, body.newPassword);
  }
}
