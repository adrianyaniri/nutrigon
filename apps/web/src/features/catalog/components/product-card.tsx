import { Plus } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { IconButton } from "@/components/atoms/icon-button";
import { PriceTag } from "@/components/atoms/price-tag";
import { ProductImage } from "@/components/atoms/product-image";
import { getEffectivePrice, isOnSale } from "@/features/catalog/lib/filter-products";
import type { CatalogProduct } from "@/features/catalog/types";

interface ProductCardProps {
  product: CatalogProduct;
  onAdd?: (product: CatalogProduct) => void;
  onSelect?: (product: CatalogProduct) => void;
}

function describeSaleUnit(product: CatalogProduct): string {
  if (product.isCombo) return "Combo · Precio especial";
  return product.saleUnit === "WEIGHT" ? "Granel · Precio por 1 kg" : "Venta por unidad";
}

function getUnitLabel(product: CatalogProduct): string {
  if (product.isCombo) return "/ combo";
  return product.saleUnit === "WEIGHT" ? "/ kg" : "/ un.";
}

/**
 * Standardized Product Card:
 * Ensures uniform height, card surface elevation, image aspect ratio,
 * and aligned price/actions across any screen resolution.
 */
export function ProductCard({ product, onAdd, onSelect }: ProductCardProps) {
  const onSale = isOnSale(product);

  return (
    <article
      onClick={() => onSelect?.(product)}
      className="group relative flex h-full w-full flex-col justify-between rounded-2xl border border-brand-border/70 bg-brand-card/90 p-3 sm:p-4 transition-all duration-200 hover:border-brand-gold/60 hover:shadow-lg hover:shadow-brand-gold/5 cursor-pointer"
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <ProductImage src={product.imageUrl} alt={product.name} />
          {product.isCombo ? (
            <Badge variant="sale" className="absolute left-2.5 top-2.5 shadow-sm">
              Combo
            </Badge>
          ) : (
            onSale && (
              <Badge variant="sale" className="absolute left-2.5 top-2.5 shadow-sm">
                Oferta
              </Badge>
            )
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
            {describeSaleUnit(product)}
          </span>
          <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-brand-border/40 pt-3">
        <PriceTag
          price={getEffectivePrice(product)}
          originalPrice={onSale ? product.price : undefined}
          unitLabel={getUnitLabel(product)}
        />
        {onAdd && (
          <IconButton
            aria-label={`Agregar ${product.name} al pedido`}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
            className="hover:scale-105 active:scale-95"
          >
            <Plus className="size-5" aria-hidden="true" />
          </IconButton>
        )}
      </div>
    </article>
  );
}

