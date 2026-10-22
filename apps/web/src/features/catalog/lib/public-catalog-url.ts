export const PUBLIC_CATALOG_ORIGIN = "https://www.nutrigon.ar";

export function getPublicCatalogUrl(branchSlug: string): string {
  return `${PUBLIC_CATALOG_ORIGIN}/catalogo/${encodeURIComponent(branchSlug)}`;
}
