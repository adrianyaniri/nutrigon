import { useState } from "react";
import { Check, Plus, Scale, Star } from "lucide-react";
import { Badge } from "@/components/atoms/badge";
import { IconButton } from "@/components/atoms/icon-button";
import { PriceTag } from "@/components/atoms/price-tag";
import { ProductImage } from "@/components/atoms/product-image";
import { getEffectivePrice, isOnSale } from "@/features/catalog/lib/filter-products";
import {
  calculatePortionPrice,
  getPortionOptions,
  referencePrice,
  getPriceReferenceGrams,
  formatWeight,
} from "@/features/catalog/lib/portion-pricing";
import type { CatalogProduct } from "@/features/catalog/types";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

interface ProductCardProps {
  product: CatalogProduct;
  onAdd?: (product: CatalogProduct) => void;
  onSelect?: (product: CatalogProduct) => void;
}

function describeSaleUnit(product: CatalogProduct): string {
  if (product.isCombo) return "Combo · Precio especial";
  return product.saleUnit === "WEIGHT"
    ? `Granel · Precio por ${formatWeight(getPriceReferenceGrams(product))}`
    : "Venta por unidad";
}

function getUnitLabel(product: CatalogProduct): string {
  if (product.isCombo) return "/ combo";
  return product.saleUnit === "WEIGHT"
    ? getPriceReferenceGrams(product) === 100
      ? "/ 100 g"
      : "/ kg"
    : "/ un.";
}

/**
 * Standardized Product Card:
 * Ensures uniform height, card surface elevation, image aspect ratio,
 * and aligned price/actions across any screen resolution without nesting interactive controls.
 */
export function ProductCard({ product, onAdd, onSelect }: ProductCardProps) {
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);
  const onSale = isOnSale(product);
  const isClickable = Boolean(onSelect);
  const isWeight = product.saleUnit === "WEIGHT" && !product.isCombo;
  const effectivePrice = getEffectivePrice(product);
  const minPortion = getPortionOptions(product)[0];
  const minPortionPrice = isWeight
    ? calculatePortionPrice(effectivePrice, minPortion.value)
    : null;

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onAdd?.(product);
    if (!isWeight) {
      setIsAddedFeedback(true);
      setTimeout(() => setIsAddedFeedback(false), 1200);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(product);
    }
  }

  const cardBody = (
    <>
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
                  <Star
                    className="size-3 fill-brand-dark text-brand-dark"
                    aria-hidden="true"
                  />
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
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {describeSaleUnit(product)}
        </span>
        <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>
      </div>
    </>
  );

  return (
    <article
      className={cn(
        "group relative flex h-full w-full flex-col justify-between rounded-2xl border border-brand-border/70 bg-brand-card/90 p-3 sm:p-4 transition-all duration-200 hover:border-brand-gold/60 hover:shadow-lg hover:shadow-brand-gold/5"
      )}
    >
      {isClickable ? (
        <button
          type="button"
          onClick={() => onSelect?.(product)}
          onKeyDown={handleKeyDown}
          aria-label={`Ver detalle de ${product.name}`}
          className="flex w-full flex-col gap-3 rounded-xl text-left cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          {cardBody}
        </button>
      ) : (
        <div className="flex w-full flex-col gap-3 rounded-xl text-left">{cardBody}</div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-brand-border/40 pt-3">
        <div className="flex flex-col">
          <PriceTag
            price={isWeight ? referencePrice(effectivePrice, product) : effectivePrice}
            originalPrice={
              onSale
                ? isWeight
                  ? referencePrice(product.price, product)
                  : product.price
                : undefined
            }
            unitLabel={getUnitLabel(product)}
          />
          {minPortionPrice !== null && (
            <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              Desde {formatPrice(minPortionPrice)} /{" "}
              {minPortion.value === "1kg" ? "1 kg" : minPortion.value}
            </span>
          )}
        </div>

        {onAdd &&
          (isWeight ? (
            <button
              type="button"
              aria-label={`Elegir gramos de ${product.name}`}
              onClick={handleAdd}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand-gold/40 bg-brand-gold/15 px-3 py-2 text-xs font-bold text-brand-gold-text hover:border-brand-gold hover:bg-brand-gold hover:text-brand-dark active:scale-95 motion-reduce:transform-none transition-all shadow-2xs"
            >
              <Scale className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Elegir</span>
            </button>
          ) : (
            <IconButton
              aria-label={
                isAddedFeedback
                  ? `${product.name} agregado al pedido`
                  : `Agregar ${product.name} al pedido`
              }
              onClick={handleAdd}
              className={cn(
                "transition-all duration-200 active:scale-95 motion-reduce:transform-none",
                isAddedFeedback
                  ? "bg-status-success text-white hover:bg-status-success/90 scale-105"
                  : "hover:scale-105"
              )}
            >
              {isAddedFeedback ? (
                <Check
                  className="size-5 animate-in zoom-in-50 duration-150"
                  aria-hidden="true"
                />
              ) : (
                <Plus className="size-5" aria-hidden="true" />
              )}
            </IconButton>
          ))}
      </div>
    </article>
  );
}
