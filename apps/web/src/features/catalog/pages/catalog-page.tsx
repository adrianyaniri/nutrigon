import { useEffect, useMemo } from "react";
import { AlertTriangle, MapPin, Store } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/molecules/empty-state";
import { SortSelect } from "@/components/molecules/sort-select";
import { useCart } from "@/features/cart";
import { CatalogFooter } from "../components/catalog-footer";
import { CatalogHeader } from "../components/catalog-header";
import { CatalogHero } from "../components/catalog-hero";
import { CategoryChips } from "../components/category-chips";
import { CategoryNav } from "../components/category-nav";
import { ProductGrid } from "../components/product-grid";
import { useCatalogFilters } from "../hooks/use-catalog-filters";
import { useBranchCatalog, useBranches } from "../hooks/use-catalog-queries";
import { buildCategoryOptions, filterAndSortProducts } from "../lib/filter-products";
import type { CatalogProduct, SortOption } from "../types";

const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: "popular", label: "Destacados" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "name-asc", label: "Nombre A-Z" },
];

export function CatalogPage() {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const navigate = useNavigate();

  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];

  const isValidBranch = branches.length === 0 || branches.some((b) => b.slug === branchSlug);

  const { filters, setSearch, setCategory, setSort, clearFilters } = useCatalogFilters();

  const catalogQuery = useBranchCatalog(isValidBranch ? (branchSlug ?? null) : null);
  const catalog = catalogQuery.data;

  const { itemCount, addProduct, clear: clearCart } = useCart();

  // Remember last visited valid branch in localStorage
  useEffect(() => {
    if (branchSlug && isValidBranch && branches.length > 0) {
      try {
        localStorage.setItem("nutrigon:last-branch", branchSlug);
      } catch {
        // Ignore storage errors in private browsing
      }
    }
  }, [branchSlug, isValidBranch, branches.length]);

  const categoryOptions = useMemo(
    () => (catalog ? buildCategoryOptions(catalog.categories, catalog.products) : []),
    [catalog]
  );

  const visibleProducts = useMemo(
    () => (catalog ? filterAndSortProducts(catalog.products, catalog.categories, filters) : []),
    [catalog, filters]
  );

  const activeCategory = categoryOptions.find((option) => option.value === filters.categorySlug);
  const isLoading = branchesQuery.isPending || (catalogQuery.isPending && !catalog);
  const hasError = branchesQuery.isError || catalogQuery.isError;

  function handleAdd(product: CatalogProduct) {
    if (branchSlug) addProduct(branchSlug, product.id);
  }

  function handleBranchChange(newSlug: string) {
    if (newSlug !== branchSlug) {
      if (itemCount > 0) {
        clearCart();
      }
      try {
        localStorage.setItem("nutrigon:last-branch", newSlug);
      } catch {
        // Ignore
      }
      navigate(`/catalogo/${newSlug}`);
    }
  }

  // Branch not found in master configuration
  if (!branchesQuery.isPending && branches.length > 0 && !isValidBranch) {
    return (
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <CatalogHeader
          branches={branches}
          branchSlug={branchSlug ?? ""}
          onBranchChange={handleBranchChange}
          search=""
          onSearchChange={() => {}}
          cartItemCount={0}
        />
        <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center justify-center px-4 py-12">
          <EmptyState
            icon={<MapPin className="size-10 text-brand-gold" />}
            title="Sucursal no encontrada"
            description={`La sucursal "${branchSlug}" no existe o el código QR es incorrecto.`}
            action={
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {branches.map((b) => (
                  <Button
                    key={b.slug}
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => handleBranchChange(b.slug)}
                  >
                    <Store className="size-4 mr-2" />
                    Ir a Sucursal {b.name}
                  </Button>
                ))}
              </div>
            }
          />
        </main>
        <CatalogFooter branches={branches} />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <CatalogHeader
        branches={branches}
        branchSlug={branchSlug ?? ""}
        onBranchChange={handleBranchChange}
        search={filters.search}
        onSearchChange={setSearch}
        cartItemCount={itemCount}
      />

      <div className="mx-auto w-full max-w-screen-xl px-4 pt-6 md:px-6">
        <CatalogHero branchName={catalog?.branch.name} />
      </div>

      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:flex-row md:gap-8 md:px-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-28">
            <CategoryNav
              options={categoryOptions}
              value={filters.categorySlug}
              onChange={setCategory}
            />
          </div>
        </aside>

        <section className="min-w-0 flex-1" aria-labelledby="catalog-title">
          <div className="mb-5 md:hidden">
            <CategoryChips
              options={categoryOptions}
              value={filters.categorySlug}
              onChange={setCategory}
            />
          </div>

          <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                id="catalog-title"
                className="font-headline text-xl font-bold tracking-tight md:text-2xl"
              >
                {activeCategory && filters.categorySlug ? activeCategory.label : "Todos los productos"}
              </h1>
              {catalog && (
                <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                  {visibleProducts.length}{" "}
                  {visibleProducts.length === 1 ? "producto" : "productos"} en Sucursal{" "}
                  {catalog.branch.name}
                </p>
              )}
            </div>
            <SortSelect value={filters.sort} options={SORT_OPTIONS} onChange={setSort} />
          </div>

          {hasError ? (
            <EmptyState
              icon={<AlertTriangle className="size-10" />}
              title="No pudimos cargar el catálogo"
              description="Revisá tu conexión e intentá de nuevo."
              action={
                <Button
                  className="mt-2 min-h-[44px]"
                  onClick={() => {
                    void branchesQuery.refetch();
                    void catalogQuery.refetch();
                  }}
                >
                  Reintentar
                </Button>
              }
            />
          ) : (
            <ProductGrid
              products={visibleProducts}
              isLoading={isLoading}
              onAdd={handleAdd}
              onClearFilters={clearFilters}
            />
          )}
        </section>
      </main>

      <CatalogFooter branches={branches} />
    </div>
  );
}
