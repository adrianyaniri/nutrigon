import {
  Controller,
  Get,
  Put,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { BranchProductsService } from './branch-products.service.js';
import {
  UpsertBranchProductDto,
  UpdateBranchProductOfferDto,
  BranchProductQueryDto,
} from './dto/branch-product.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthBranchScoped } from '../../common/decorators/auth-roles.decorator.js';

@Controller('branches')
export class BranchProductsController {
  constructor(private readonly branchProductsService: BranchProductsService) {}

  @Public()
  @Get(':slug/catalog')
  async getPublicCatalog(
    @Param('slug') slug: string,
    @Query() query: BranchProductQueryDto,
  ) {
    return this.branchProductsService.getPublicCatalog(slug, query);
  }

  @Public()
  @Get(':slug/offers')
  async getPublicOffers(@Param('slug') slug: string) {
    return this.branchProductsService.getPublicOffers(slug);
  }

  @AuthBranchScoped()
  @Get(':branchId/products')
  async listForBranch(
    @Param('branchId') branchId: string,
    @Query() query: BranchProductQueryDto,
  ) {
    return this.branchProductsService.listForBranch(branchId, query);
  }

  @AuthBranchScoped()
  @Get(':branchId/products/counts')
  async countByStatus(@Param('branchId') branchId: string) {
    return this.branchProductsService.countByStatus(branchId);
  }

  @AuthBranchScoped()
  @Put(':branchId/products/:productId')
  async upsert(
    @Param('branchId') branchId: string,
    @Param('productId') productId: string,
    @Body() dto: UpsertBranchProductDto,
  ) {
    return this.branchProductsService.upsert(branchId, productId, dto);
  }

  @AuthBranchScoped()
  @Patch(':branchId/products/:productId/offer')
  async updateOffer(
    @Param('branchId') branchId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateBranchProductOfferDto,
  ) {
    return this.branchProductsService.updateOffer(branchId, productId, dto);
  }
}
