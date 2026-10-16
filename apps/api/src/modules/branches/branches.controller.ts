import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@nutrigon/contracts';
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  AuthRoles,
  AuthBranchScoped,
} from '../../common/decorators/auth-roles.decorator.js';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Public()
  @Get()
  async findAll(@Query('includeInactive') includeInactive?: string) {
    if (includeInactive === 'true') {
      return this.branchesService.findAll();
    }
    return this.branchesService.findAllActive();
  }

  @Public()
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.branchesService.findBySlug(slug);
  }

  @AuthRoles(Role.ADMIN_GENERAL)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @AuthBranchScoped()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @AuthRoles(Role.ADMIN_GENERAL)
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return this.branchesService.softDelete(id);
  }
}
