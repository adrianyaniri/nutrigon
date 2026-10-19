import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, MapPin, QrCode, ShoppingBag, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/molecules/empty-state";
import { SearchInput } from "@/components/molecules/search-input";
import { SortSelect } from "@/components/molecules/sort-select";
import { useCart, CartDrawer } from "@/features/cart";
import { formatPrice } from "@/lib/format/price";
import { CatalogFooter } from "../components/catalog-footer";
import { CatalogHeader } from "../components/catalog-header";
import { CatalogHero } from "../components/catalog-hero";
import { CategoryChips } from "../components/category-chips";
import { CategoryDrawer } from "../components/category-drawer";
import { CategoryNav } from "../components/category-nav";
import { ProductModal } from "../components/product-modal";
import { ProductGrid } from "../components/product-grid";
import { useCatalogFilters } from "../hooks/use-catalog-filters";
import { useBranchCatalog, useBranches } from "../hooks/use-catalog-queries";
import {
  buildCategoryOptions,
  filterAndSortProducts,
  getEffectivePrice,
} from "../lib/filter-products";
import { calculatePortionPrice } from "../lib/portion-pricing";
import type { CatalogProduct, SortOption } from "../types";

const SORT_OPTIONS: readonly { value: SortOption; label: string }[] = [
  { value: "popular", label: "Destacados" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
  { value: "name-asc", label: "Nombre A-Z" },
];

export function CatalogPage() {
  const { branchSlug } = useParams<{ branchSlug: string }>();

  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];

  const isValidBranch = branches.length === 0 || branches.some((b) => b.slug === branchSlug);

  const { filters, setSearch, setCategory, setSort, clearFilters } = useCatalogFilters();

  const catalogQuery = useBranchCatalog(isValidBranch ? (branchSlug ?? null) : null);
  const catalog = catalogQuery.data;

  const { state: cartState, itemCount, addProduct } = useCart();

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
    () =>
      catalog
        ? buildCategoryOptions(catalog.categories, catalog.products, {
            includeSpecialFilters: true,
          })
        : [],
    [catalog]
  );

  const visibleProducts = useMemo(
    () => (catalog ? filterAndSortProducts(catalog.products, catalog.categories, filters) : []),
    [catalog, filters]
  );

  const cartTotalAmount = useMemo(() => {
    if (!catalog) return 0;
    const productMap = new Map(catalog.products.map((p) => [p.id, p]));
    return cartState.lines.reduce((acc, line) => {
      const product = productMap.get(line.productId);
      if (!product) return acc;
      const basePrice = getEffectivePrice(product);
      const unitPrice =
        product.saleUnit === "WEIGHT" && line.portion
          ? calculatePortionPrice(basePrice, line.portion)
          : basePrice;
      return acc + unitPrice * line.quantity;
    }, 0);
  }, [catalog, cartState.lines]);

  const activeCategory = categoryOptions.find((option) => option.value === filters.categorySlug);
  const isLoading = branchesQuery.isPending || (catalogQuery.isPending && !catalog);
  const hasError = branchesQuery.isError || catalogQuery.isError;

  function handleAdd(product: CatalogProduct) {
    if (product.saleUnit === "WEIGHT" && !product.isCombo) {
      setSelectedProduct(product);
    } else if (branchSlug) {
      addProduct(branchSlug, product.id);
    }
  }

  // Branch not found in master configuration
  if (!branchesQuery.isPending && branches.length > 0 && !isValidBranch) {
    return (
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <CatalogHeader branchSlug={branchSlug ?? ""} cartItemCount={0} />
        <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center justify-center px-4 py-12">
          <EmptyState
            icon={<MapPin className="size-10 text-brand-gold-text" />}
            title="Sucursal no encontrada"
            description={`La sucursal "${branchSlug}" no existe o el código QR es incorrecto. Escaneá el código QR en el mostrador de tu sucursal para acceder al catálogo correspondiente.`}
            action={
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-2.5 text-xs font-semibold text-brand-gold-text">
                <QrCode className="size-4 shrink-0" aria-hidden="true" />
                <span>Acceso exclusivo mediante código QR de cada sucursal</span>
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
        branchSlug={branchSlug ?? ""}
        branchName={catalog?.branch.name}
        cartItemCount={itemCount}
        onOpenCategories={() => setIsCategoryDrawerOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main
        className={`mx-auto flex w-full max-w-screen-xl flex-1 flex-col gap-6 px-4 pt-4 sm:pt-6 md:flex-row md:gap-8 md:px-6 ${
          itemCount > 0
            ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        }`}
      >
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-24">
            <CategoryNav
              options={categoryOptions}
              value={filters.categorySlug}
              onChange={setCategory}
            />
          </div>
        </aside>

        {/* Main Catalog View */}
        <section className="min-w-0 flex-1" aria-labelledby="catalog-title">
          {/* Brand Presentation / Hero Banner (shows on root branch catalog view) */}
          {!filters.search && !filters.categorySlug && (
            <CatalogHero branchName={catalog?.branch.name} />
          )}

          {/* Integrated Catalog Toolbar: Search + Sort + Category heading */}
          <div className="mb-6 flex flex-col gap-4 border-b border-border pb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput
                value={filters.search}
                onChange={setSearch}
                className="w-full sm:max-w-md"
              />

              <div className="flex items-center justify-end gap-3">
                <SortSelect value={filters.sort} options={SORT_OPTIONS} onChange={setSort} />
              </div>
            </div>

            {/* Mobile / Tablet Horizontal Category Chips Dock */}
            <div className="md:hidden pt-0.5">
              <CategoryChips
                options={categoryOptions}
                value={filters.categorySlug}
                onChange={setCategory}
                onOpenDrawer={() => setIsCategoryDrawerOpen(true)}
              />
            </div>

            {/* Active Category Heading and Filter Dismiss Tag */}
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
                      className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-brand-gold-text hover:bg-brand-gold/25 transition-colors"
                      title="Quitar filtro de categoría"
                    >
                      <span>Quitar filtro</span>
                      <X className="size-3" />
                    </button>
                  )}
                </div>
                {catalog && (
                  <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
                    {visibleProducts.length}{" "}
                    {visibleProducts.length === 1 ? "producto" : "productos"} disponibles en Sucursal{" "}
                    {catalog.branch.name}
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
          ) : (
            <ProductGrid
              products={visibleProducts}
              isLoading={isLoading}
              onAdd={handleAdd}
              onSelect={setSelectedProduct}
              onClearFilters={clearFilters}
              suggestedCategories={categoryOptions
                .filter((c) => Boolean(c.value))
                .map((c) => ({ slug: c.value!, label: c.label }))}
              onSelectCategory={setCategory}
            />
          )}
        </section>
      </main>

      {/* Mobile Sticky Bottom Cart Dock */}
      {itemCount > 0 && !isCartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:hidden pointer-events-none">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Ver pedido: ${itemCount} ${itemCount === 1 ? "producto" : "productos"}, total ${formatPrice(cartTotalAmount)}`}
            className="pointer-events-auto mx-auto flex min-h-[52px] w-full max-w-md items-center justify-between rounded-2xl bg-primary px-4 py-3 text-primary-foreground shadow-xl ring-1 ring-brand-gold/50 transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-xl bg-brand-dark/15 font-headline text-xs font-extrabold tabular-nums">
                {itemCount}
              </span>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-85">
                  Tu pedido · {itemCount} {itemCount === 1 ? "ítem" : "ítems"}
                </span>
                <span className="font-headline text-sm font-black tracking-tight">
                  {formatPrice(cartTotalAmount)}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark/10 px-3 py-1.5 text-xs font-bold">
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              <span>Ver pedido</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile/Tablet Category Slide-over Drawer */}
      <CategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
        options={categoryOptions}
        value={filters.categorySlug}
        onChange={setCategory}
      />

      {/* Cart Review & WhatsApp Dispatch Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        branch={catalog?.branch}
        products={catalog?.products ?? []}
      />

      {/* Product Detail & Bulk Portion Modal */}
      <ProductModal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        branch={catalog?.branch}
        categories={catalog?.categories ?? []}
      />

      <CatalogFooter currentBranch={catalog?.branch} branches={branches} />
    </div>
  );
}

