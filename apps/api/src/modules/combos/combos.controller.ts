import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CombosService } from './combos.service.js';
import { CreateComboDto, UpdateComboDto } from './dto/combo.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthBranchScoped, AuthBranchMutate } from '../../common/decorators/auth-roles.decorator.js';

@Controller('branches')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Public()
  @Get(':slug/catalog/combos')
  async listPublicForBranch(@Param('slug') slug: string) {
    return this.combosService.listPublicForBranch(slug);
  }

  @AuthBranchScoped()
  @Get(':branchId/combos')
  async listForBranch(@Param('branchId') branchId: string) {
    return this.combosService.listForBranch(branchId);
  }

  @AuthBranchMutate()
  @Post(':branchId/combos')
  @HttpCode(HttpStatus.CREATED)
  async createForBranch(
    @Param('branchId') branchId: string,
    @Body() dto: CreateComboDto,
  ) {
    return this.combosService.createForBranch(branchId, dto);
  }

  @AuthBranchMutate()
  @Patch(':branchId/combos/:comboId')
  async updateForBranch(
    @Param('branchId') branchId: string,
    @Param('comboId') comboId: string,
    @Body() dto: UpdateComboDto,
  ) {
    return this.combosService.updateForBranch(branchId, comboId, dto);
  }

  @AuthBranchMutate()
  @Delete(':branchId/combos/:comboId')
  async softDeleteForBranch(
    @Param('branchId') branchId: string,
    @Param('comboId') comboId: string,
  ) {
    return this.combosService.softDeleteForBranch(branchId, comboId);
  }
}
