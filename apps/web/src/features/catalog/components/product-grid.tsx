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
}

const SKELETON_COUNT = 8;

export function ProductGrid({
  products,
  isLoading,
  onAdd,
  onSelect,
  onClearFilters,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando productos"
        className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 xl:grid-cols-4"
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
        icon={<SearchX className="size-10" />}
        title="No encontramos productos"
        description="Probá con otra búsqueda o quitá los filtros para ver todo el catálogo."
        action={
          <Button variant="outline" className="mt-2 min-h-[44px]" onClick={onClearFilters}>
            Quitar filtros
          </Button>
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id} className="flex">
          <div className="flex w-full">
            <ProductCard product={product} onAdd={onAdd} onSelect={onSelect} />
          </div>
        </li>
      ))}
    </ul>
  );
}
