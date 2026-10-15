import type { BranchCatalog, CatalogBranch } from "../types";
import { getMockBranchCatalog, getMockBranches } from "./mock-catalog";

export interface CatalogRepository {
  getBranches(): Promise<CatalogBranch[]>;
  getBranchCatalog(branchSlug: string): Promise<BranchCatalog>;
}

const mockCatalogRepository: CatalogRepository = {
  async getBranches() {
    return getMockBranches();
  },
  async getBranchCatalog(branchSlug) {
    const catalog = getMockBranchCatalog(branchSlug);
    if (!catalog) {
      throw new Error(`Branch "${branchSlug}" was not found.`);
    }
    return catalog;
  },
};

export const catalogRepository: CatalogRepository = mockCatalogRepository;
