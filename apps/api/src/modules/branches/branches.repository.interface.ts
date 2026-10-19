import type { BranchEntity, NewBranchEntity } from '../../core/database/schema/branches.js';

export const BRANCHES_REPOSITORY = Symbol('BRANCHES_REPOSITORY');

export interface IBranchesRepository {
  findAllActive(): Promise<BranchEntity[]>;
  findAll(): Promise<BranchEntity[]>;
  findById(id: string): Promise<BranchEntity | null>;
  findBySlug(slug: string): Promise<BranchEntity | null>;
  create(data: NewBranchEntity): Promise<BranchEntity>;
  update(id: string, data: Partial<NewBranchEntity>): Promise<BranchEntity | null>;
}
