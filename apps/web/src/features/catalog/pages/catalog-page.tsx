import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, MapPin, ShoppingBag, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/molecules/empty-state";
import { SearchInput } from "@/components/molecules/search-input";
import { SortSelect } from "@/components/molecules/sort-select";
import { useCart, CartDrawer } from "@/features/cart";
import { captureAnalyticsEvent } from "@/app/analytics/posthog";
import { formatPrice } from "@/lib/format/price";
import { CatalogFooter } from "../components/catalog-footer";
import { CatalogHeader } from "../components/catalog-header";
import { CatalogHero } from "../components/catalog-hero";
import { BranchQrModal } from "../components/branch-qr-modal";
import { CategoryChips } from "../components/category-chips";
import { CategoryDrawer } from "../components/category-drawer";
import { CategoryNav } from "../components/category-nav";
import { ProductModal } from "../components/product-modal";
import { ProductGrid } from "../components/product-grid";
import { useCatalogFilters } from "../hooks/use-catalog-filters";
import { useBranchCatalogPages, useBranches } from "../hooks/use-catalog-queries";
import {
  buildCategoryOptions,
  filterAndSortProducts,
  getEffectivePrice,
} from "../lib/filter-products";
import { getEffectivePortionPrice } from "../lib/portion-pricing";
import type { BranchCatalogPage, CatalogProduct, SortOption } from "../types";

const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: "popular", label: "Destacados" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "name-asc", label: "Nombre A-Z" },
];
const EMPTY_PAGES: readonly BranchCatalogPage[] = [];

function uniqueProducts(
  pages: readonly { products: CatalogProduct[] }[]
): CatalogProduct[] {
  const seen = new Set<string>();
  return pages
    .flatMap((page) => page.products)
    .filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
}

export function CatalogPage() {
  const { branchSlug } = useParams<{ branchSlug: string }>();
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];
  const isValidBranch =
    branches.length === 0 || branches.some((branch) => branch.slug === branchSlug);
  const { filters, setSearch, setCategory, setSort, clearFilters } = useCatalogFilters();
  const catalogQuery = useBranchCatalogPages(
    isValidBranch ? (branchSlug ?? null) : null,
    filters
  );
  const pages = catalogQuery.data?.pages ?? EMPTY_PAGES;
  const catalog = pages[0];
  const products = useMemo(() => uniqueProducts(pages), [pages]);
  const { state: cartState, itemCount, addProduct } = useCart();

  useEffect(() => {
    if (!branchSlug || !isValidBranch || branches.length === 0) return;
    try {
      localStorage.setItem("nutrigon:last-branch", branchSlug);
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, [branchSlug, isValidBranch, branches.length]);

  const categoryOptions = useMemo(
    () =>
      catalog
        ? buildCategoryOptions(catalog.categories, products, {
            includeSpecialFilters: true,
            includeEmptyCategories: true,
          })
        : [],
    [catalog, products]
  );
  const visibleProducts = useMemo(
    () => (catalog ? filterAndSortProducts(products, catalog.categories, filters) : []),
    [catalog, products, filters]
  );
  const cartTotalAmount = useMemo(() => {
    const productMap = new Map(products.map((product) => [product.id, product]));
    return cartState.lines.reduce((total, line) => {
      const product = productMap.get(line.productId);
      if (!product) return total;
      const price = getEffectivePrice(product);
      const unitPrice =
        product.saleUnit === "WEIGHT" && line.portion
          ? getEffectivePortionPrice(product, line.portion)
          : price;
      return total + unitPrice * line.quantity;
    }, 0);
  }, [products, cartState.lines]);

  const activeCategory = categoryOptions.find(
    (option) => option.value === filters.categorySlug
  );
  const isLoading = branchesQuery.isPending || (catalogQuery.isPending && !catalog);
  const hasError = branchesQuery.isError || catalogQuery.isError;
  const isEmptyCatalog = Boolean(
    catalog && catalog.total === 0 && !filters.search && !filters.categorySlug
  );

  function handleAdd(product: CatalogProduct) {
    if (product.saleUnit === "WEIGHT" && !product.isCombo) handleSelectProduct(product);
    else if (branchSlug) addProduct(branchSlug, product.id);
  }

  function handleSelectProduct(product: CatalogProduct) {
    setSelectedProduct(product);
    captureAnalyticsEvent("product_viewed", {
      product_id: product.id,
      ...(product.categoryId ? { product_category: product.categoryId } : {}),
    });
  }

  function handleOpenCart() {
    setIsCartOpen(true);
    if (itemCount > 0)
      captureAnalyticsEvent("checkout_started", { cart_items_count: itemCount });
  }

  if (!branchesQuery.isPending && branches.length > 0 && !isValidBranch) {
    return (
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <CatalogHeader branchSlug={branchSlug ?? ""} cartItemCount={0} />
        <main className="mx-auto flex w-full max-w-screen-xl flex-1 items-center justify-center px-4 py-12">
          <EmptyState
            icon={<MapPin className="size-10 text-brand-gold-text" />}
            title="Sucursal no encontrada"
            description={`La sucursal "${branchSlug}" no existe o el código QR es incorrecto.`}
            action={
              <Link
                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-brand-gold/30 px-4 py-2.5 text-xs font-semibold text-brand-gold-text"
                to="/catalogo"
              >
                Elegir sucursal
              </Link>
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
        branchSlug={branchSlug ?? ""}
        branchName={catalog?.branch.name}
        cartItemCount={itemCount}
        onOpenCategories={() => setIsCategoryDrawerOpen(true)}
        onOpenCart={handleOpenCart}
        onOpenQr={catalog ? () => setIsQrModalOpen(true) : undefined}
      />
      <main
        className={`mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-6 px-4 pt-4 sm:pt-6 md:flex-row md:gap-8 md:px-6 ${itemCount > 0 ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))]" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"}`}
      >
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24">
            <CategoryNav
              options={categoryOptions}
              value={filters.categorySlug}
              onChange={setCategory}
            />
          </div>
        </aside>
        <section className="min-w-0 flex-1" aria-labelledby="catalog-title">
          {!filters.search && !filters.categorySlug && (
            <CatalogHero branchName={catalog?.branch.name} />
          )}
          <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput
                value={filters.search}
                onChange={setSearch}
                className="w-full sm:max-w-md"
              />
              <div className="flex items-center justify-end gap-3">
                <SortSelect
                  value={filters.sort}
                  options={SORT_OPTIONS}
                  onChange={setSort}
                />
              </div>
            </div>
            <div className="md:hidden pt-0.5">
              <CategoryChips
                options={categoryOptions}
                value={filters.categorySlug}
                onChange={setCategory}
                onOpenDrawer={() => setIsCategoryDrawerOpen(true)}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    id="catalog-title"
                    className="font-headline text-xl font-bold tracking-tight md:text-2xl"
                  >
                    {activeCategory && filters.categorySlug
                      ? activeCategory.label
                      : "Todos los productos"}
                  </h1>
                  {filters.categorySlug && (
                    <button
                      type="button"
                      onClick={() => setCategory(null)}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-brand-gold/15 px-3 py-1.5 text-xs font-semibold text-brand-gold-text"
                      aria-label="Quitar filtro de categoría"
                    >
                      <span>Quitar filtro</span>
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {catalog && (
                  <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                    {catalog.total} {catalog.total === 1 ? "producto" : "productos"}{" "}
                    disponibles en Sucursal {catalog.branch.name}
                  </p>
                )}
              </div>
            </div>
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
          ) : isEmptyCatalog ? (
            <EmptyState
              icon={<ShoppingBag className="size-10 text-brand-gold-text" />}
              title="Este catálogo todavía no tiene productos disponibles"
              description="Volvé a la selección para consultar otra sucursal."
              action={
                <Link
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-brand-gold/30 px-4 py-2.5 text-xs font-semibold text-brand-gold-text"
                  to="/catalogo"
                >
                  Elegir sucursal
                </Link>
              }
            />
          ) : (
            <>
              <ProductGrid
                products={visibleProducts}
                isLoading={isLoading}
                onAdd={handleAdd}
                onSelect={handleSelectProduct}
                onClearFilters={clearFilters}
                suggestedCategories={categoryOptions
                  .filter((option) => Boolean(option.value))
                  .map((option) => ({ slug: option.value!, label: option.label }))}
                onSelectCategory={setCategory}
              />
              {catalogQuery.hasNextPage && (
                <div className="mt-8 flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] px-6"
                    disabled={catalogQuery.isFetchingNextPage}
                    onClick={() => void catalogQuery.fetchNextPage()}
                  >
                    {catalogQuery.isFetchingNextPage ? "Cargando productos…" : "Ver más"}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      {itemCount > 0 && !isCartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden pointer-events-none">
          <button
            type="button"
            onClick={handleOpenCart}
            aria-label={`Ver pedido: ${itemCount} ${itemCount === 1 ? "producto" : "productos"}, total ${formatPrice(cartTotalAmount)}`}
            className="pointer-events-auto mx-auto flex min-h-[52px] w-full max-w-md items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-xl"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-brand-dark/15 font-headline text-xs font-extrabold">
                {itemCount}
              </span>
              <span className="font-headline text-sm font-black">
                {formatPrice(cartTotalAmount)}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark/10 px-3 py-1.5 text-xs font-bold">
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              Ver pedido
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </button>
        </div>
      )}
      <CategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
        options={categoryOptions}
        value={filters.categorySlug}
        onChange={setCategory}
      />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        branch={catalog?.branch}
        products={products}
      />
      <ProductModal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        branch={catalog?.branch}
        categories={catalog?.categories ?? []}
      />
      {catalog && (
        <BranchQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          branch={catalog.branch}
        />
      )}
      <CatalogFooter currentBranch={catalog?.branch} branches={branches} />
    </div>
  );
}
