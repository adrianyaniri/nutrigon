import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesRepository } from './categories.repository.js';
import { CATEGORIES_REPOSITORY } from './categories.repository.interface.js';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CATEGORIES_REPOSITORY,
      useClass: CategoriesRepository,
    },
  ],
  exports: [CategoriesService, CATEGORIES_REPOSITORY],
})
export class CategoriesModule {}
