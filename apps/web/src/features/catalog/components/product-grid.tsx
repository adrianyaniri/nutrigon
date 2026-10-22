import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/molecules/empty-state";
import type { CatalogProduct } from "../types";
import { ProductCard } from "./product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";

interface ProductGridProps {
  products: readonly CatalogProduct[];
  isLoading: boolean;
  onAdd: (product: CatalogProduct) => void;
  onSelect?: (product: CatalogProduct) => void;
  onClearFilters: () => void;
  suggestedCategories?: readonly { slug: string; label: string }[];
  onSelectCategory?: (slug: string) => void;
}

const SKELETON_COUNT = 8;

export function ProductGrid({
  products,
  isLoading,
  onAdd,
  onSelect,
  onClearFilters,
  suggestedCategories,
  onSelectCategory,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando productos"
        className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-3 xl:grid-cols-4"
      >
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<SearchX className="size-10 text-brand-gold/70" />}
        title="No encontramos productos"
        description="Probá con otra búsqueda o seleccioná una categoría para explorar el catálogo:"
        action={
          <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-md">
            {suggestedCategories &&
              suggestedCategories.length > 0 &&
              onSelectCategory && (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {suggestedCategories.slice(0, 4).map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => onSelectCategory(cat.slug)}
                      className="inline-flex min-h-[44px] items-center rounded-xl border border-border/80 bg-brand-surface/70 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors"
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              )}
            <Button
              variant="outline"
              className="min-h-[44px] w-full sm:w-auto"
              onClick={onClearFilters}
            >
              Quitar filtros
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="flex min-w-0">
          <div className="flex min-w-0 w-full">
            <ProductCard product={product} onAdd={onAdd} onSelect={onSelect} />
          </div>
        </li>
      ))}
    </ul>
  );
}
