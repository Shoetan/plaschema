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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../platform/auth/roles.decorator';
import { UuidV7Pipe } from '../../../platform/http/uuid-v7.pipe';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { GetUserUseCase } from '../application/get-user.use-case';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { ResetPasswordUseCase } from '../application/reset-password.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import {
  CreateUserDto,
  ListUsersQueryDto,
  ResetPasswordDto,
  UpdateUserDto,
  UserResponseDto,
} from './identity.dto';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Roles('admin')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
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
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async list(@Query() query: ListUsersQueryDto) {
    const result = await this.listUsers.execute(query);
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
    };
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
