import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role, type UserItem } from '@nutrigon/contracts';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_GENERAL)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async listByBranch(@Query('branchId') branchId?: string): Promise<UserItem[]> {
    return this.usersService.listByBranch(branchId ?? '');
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() dto: CreateUserDto): Promise<UserItem> {
    return this.usersService.createUser(dto);
  }

  @Patch(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.usersService.resetPassword(id, dto);
  }
}
