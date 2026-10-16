import { Module } from '@nestjs/common';
import { BranchProductsController } from './branch-products.controller.js';
import { BranchProductsService } from './branch-products.service.js';
import { BranchProductsRepository } from './branch-products.repository.js';
import { BRANCH_PRODUCTS_REPOSITORY } from './branch-products.repository.interface.js';
import { BranchesModule } from '../branches/branches.module.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [BranchesModule, ProductsModule],
  controllers: [BranchProductsController],
  providers: [
    BranchProductsService,
    {
      provide: BRANCH_PRODUCTS_REPOSITORY,
      useClass: BranchProductsRepository,
    },
  ],
  exports: [BranchProductsService, BRANCH_PRODUCTS_REPOSITORY],
})
export class BranchProductsModule {}
