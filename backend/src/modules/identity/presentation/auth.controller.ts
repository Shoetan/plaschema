import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../platform/auth/current-user.decorator';
import { Public } from '../../../platform/auth/public.decorator';
import { GetUserUseCase } from '../application/get-user.use-case';
import { LoginUseCase } from '../application/login.use-case';
import { LoginDto, LoginResponseDto, UserResponseDto } from './identity.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ type: LoginResponseDto })
  login(@Body() body: LoginDto) {
    return this.loginUseCase.execute(body);
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.getUserUseCase.execute(user.id);
  }
}
