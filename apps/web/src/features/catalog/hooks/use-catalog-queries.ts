import { useQuery } from "@tanstack/react-query";
import { catalogRepository } from "../data/catalog-repository";

export const catalogKeys = {
  branches: ["catalog", "branches"] as const,
  branch: (slug: string) => ["catalog", "branch", slug] as const,
};

export function useBranches() {
  return useQuery({
    queryKey: catalogKeys.branches,
    queryFn: () => catalogRepository.getBranches(),
  });
}

export function useBranchCatalog(branchSlug: string | null) {
  return useQuery({
    queryKey: catalogKeys.branch(branchSlug ?? ""),
    queryFn: () => catalogRepository.getBranchCatalog(branchSlug as string),
    enabled: branchSlug !== null,
    // Keep showing the previous branch's products while the next one loads.
    placeholderData: (previous) => previous,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
