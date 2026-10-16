import { useState } from "react";
import { Check, Plus, Star } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { IconButton } from "@/components/atoms/icon-button";
import { PriceTag } from "@/components/atoms/price-tag";
import { ProductImage } from "@/components/atoms/product-image";
import { getEffectivePrice, isOnSale } from "@/features/catalog/lib/filter-products";
import type { CatalogProduct } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";

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
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const onSale = isOnSale(product);
  const isClickable = Boolean(onSelect);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onAdd?.(product);
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1200);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      if ((e.target as HTMLElement).tagName !== "BUTTON") {
        e.preventDefault();
        onSelect?.(product);
      }
    }
  }

  return (
    <article
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onSelect?.(product) : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      aria-label={isClickable ? `Ver detalle de ${product.name}` : undefined}
      className={cn(
        "group relative flex h-full w-full flex-col justify-between rounded-2xl border border-brand-border/70 bg-brand-card/90 p-3 sm:p-4 transition-all duration-200 hover:border-brand-gold/60 hover:shadow-lg hover:shadow-brand-gold/5",
        isClickable && "cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-gold"
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="relative">
          <ProductImage src={product.imageUrl} alt={product.name} />
          <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
            {product.isCombo ? (
              <Badge variant="sale" className="shadow-sm">
                Combo
              </Badge>
            ) : (
              <>
                {product.isFeatured && (
                  <Badge variant="featured" className="shadow-sm flex items-center gap-1">
                    <Star className="size-3 fill-stone-950" aria-hidden="true" />
                    <span>Destacado</span>
                  </Badge>
                )}
                {onSale && (
                  <Badge variant="sale" className="shadow-sm">
                    Oferta
                  </Badge>
                )}
              </>
            )}
          </div>
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
            aria-label={
              isAddedFeedback
                ? `${product.name} agregado al pedido`
                : `Agregar ${product.name} al pedido`
            }
            onClick={handleAdd}
            className={cn(
              "transition-all duration-200 active:scale-95",
              isAddedFeedback
                ? "bg-emerald-600 text-white hover:bg-emerald-600 scale-105"
                : "hover:scale-105"
            )}
          >
            {isAddedFeedback ? (
              <Check className="size-5 animate-in zoom-in-50 duration-150" aria-hidden="true" />
            ) : (
              <Plus className="size-5" aria-hidden="true" />
            )}
          </IconButton>
        )}
      </div>
    </article>
  );
}

