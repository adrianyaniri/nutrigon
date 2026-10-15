import type { CategoryEntity, NewCategoryEntity } from '../../core/database/schema/categories.js';

export const CATEGORIES_REPOSITORY = Symbol('CATEGORIES_REPOSITORY');

export interface ICategoriesRepository {
  findAllActive(): Promise<CategoryEntity[]>;
  findAll(): Promise<CategoryEntity[]>;
  findById(id: string): Promise<CategoryEntity | null>;
  findBySlug(slug: string): Promise<CategoryEntity | null>;
  create(data: NewCategoryEntity): Promise<CategoryEntity>;
  update(id: string, data: Partial<NewCategoryEntity>): Promise<CategoryEntity | null>;
}
