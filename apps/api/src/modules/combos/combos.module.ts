import { Module } from '@nestjs/common';
import { CombosController } from './combos.controller.js';
import { CombosService } from './combos.service.js';
import { CombosRepository } from './combos.repository.js';
import { COMBOS_REPOSITORY } from './combos.repository.interface.js';
import { BranchesModule } from '../branches/branches.module.js';
import { ProductsModule } from '../products/products.module.js';

@Module({
  imports: [BranchesModule, ProductsModule],
  controllers: [CombosController],
  providers: [
    CombosService,
    {
      provide: COMBOS_REPOSITORY,
      useClass: CombosRepository,
    },
  ],
  exports: [CombosService, COMBOS_REPOSITORY],
})
export class CombosModule {}
