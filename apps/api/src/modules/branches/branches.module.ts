import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service.js';
import { BranchesController } from './branches.controller.js';
import { BranchesRepository } from './branches.repository.js';
import { BRANCHES_REPOSITORY } from './branches.repository.interface.js';

@Module({
  controllers: [BranchesController],
  providers: [
    BranchesService,
    {
      provide: BRANCHES_REPOSITORY,
      useClass: BranchesRepository,
    },
  ],
  exports: [BranchesService, BRANCHES_REPOSITORY],
})
export class BranchesModule {}
