import { memo } from "react";
import { Check, Sparkles, Star, Tag, Undo2 } from "lucide-react";
import { ProductImage } from "@/components/atoms/product-image";
import { Button } from "@/components/ui/button";
import type { BranchProductAdminItem } from "@/features/pricing/data/branch-pricing-repository";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";
import {
  referencePrice,
  formatWeight,
  getPriceReferenceGrams,
  calculatePortionPrice,
  toPricePerKg,
} from "../lib/portion-pricing";

export interface BranchProductRowProps {
  item: BranchProductAdminItem;
  draftValue: string;
  isSaving: boolean;
  isReadOnly?: boolean;
  onDraftPriceChange: (productId: string, value: string) => void;
  onSavePrice: (item: BranchProductAdminItem) => void;
  onToggleAvailability: (item: BranchProductAdminItem) => void;
  onToggleFeatured: (item: BranchProductAdminItem) => void;
  onOpenOfferModal: (item: BranchProductAdminItem) => void;
}

export const BranchProductRow = memo(function BranchProductRow({
  item,
  draftValue,
  isSaving,
  isReadOnly = false,
  onDraftPriceChange,
  onSavePrice,
  onToggleAvailability,
  onToggleFeatured,
  onOpenOfferModal,
}: BranchProductRowProps) {
  const reference = getPriceReferenceGrams(item);
  const displayPrice = (price: number) =>
    item.saleUnit === "WEIGHT" ? referencePrice(price, item) : price;
  const unitSuffix =
    item.saleUnit === "WEIGHT" ? (reference === 100 ? "/ 100 g" : "/ kg") : "/ un.";
  const unitBadge =
    item.saleUnit === "WEIGHT"
      ? `Granel · Precio por ${formatWeight(reference)}`
      : "Venta por unidad";
  const isConfigured = item.price !== null && item.price > 0;
  const savedPriceStr =
    item.price !== null && item.price !== undefined
      ? String(displayPrice(item.price))
      : "";
  const isDirty = draftValue.trim() !== "" && draftValue.trim() !== savedPriceStr;

  return (
    <article className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-outline bg-surface-card p-4 sm:p-5 transition-colors hover:border-outline-variant">
      {/* Left: Product Identity & Status Badges */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <div className="size-14 sm:size-16 shrink-0 overflow-hidden rounded-xl border border-outline bg-surface">
          <ProductImage src={item.imageUrls[0] ?? null} alt={item.name} />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          {/* Top Eyebrow: Category · Unit · Status + Promo chips (Oferta & Destacado) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold shrink-0">
              {item.categoryName}
            </span>
            <span className="text-muted-foreground select-none">·</span>
            <span className="text-[11px] font-medium text-foreground/90 shrink-0">
              {unitBadge}
            </span>
            <span className="text-muted-foreground select-none">·</span>

            {item.status === "ACTIVE" && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span>En tienda</span>
              </span>
            )}
            {item.status === "INACTIVE" && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400 shrink-0">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span>Pausado</span>
              </span>
            )}
            {item.status === "UNCONFIGURED" && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground shrink-0">
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                <span>Sin precio</span>
              </span>
            )}

            {/* Promo Chips */}
            {item.isOnSale && item.promotionalPrice !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-gold shrink-0">
                <Sparkles className="size-2.5 shrink-0" aria-hidden="true" />
                <span>
                  Oferta {formatPrice(displayPrice(item.promotionalPrice))} {unitSuffix}
                </span>
              </span>
            )}

            {item.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300 shrink-0">
                <Star
                  className="size-2.5 fill-amber-300 text-amber-300 shrink-0"
                  aria-hidden="true"
                />
                <span>Destacado</span>
              </span>
            )}
          </div>

          {/* Product Name */}
          <h2 className="font-headline text-sm sm:text-base font-bold text-foreground truncate">
            {item.name}
          </h2>

          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Right: Read-Only view for ADMIN_GENERAL OR Interactive Price/Status Controls for Branch Admin */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-3 border-t border-outline/60 lg:pt-0 lg:border-t-0 shrink-0">
        {isReadOnly ? (
          <div className="flex items-center gap-3 py-1">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono block">
                Precio Sucursal
              </span>
              <p className="font-headline text-base sm:text-lg font-bold text-brand-gold tabular-nums">
                {isConfigured
                  ? `${formatPrice(displayPrice(item.price!))} ${unitSuffix}`
                  : "Sin precio asignado"}
              </p>
              {item.saleUnit === "WEIGHT" && isConfigured && (
                <span className="text-[11px] text-muted-foreground font-medium block tabular-nums">
                  ({formatPrice(calculatePortionPrice(item.price!, "100g"))} / 100g)
                </span>
              )}
            </div>
            <div className="rounded-lg border border-outline bg-surface-elevated px-2.5 py-1 text-[11px] font-medium text-muted-foreground select-none">
              Solo Lectura
            </div>
          </div>
        ) : (
          <>
            {/* Price Input Group */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <div className="relative flex items-center">
                  <span className="pointer-events-none absolute left-2.5 text-xs font-bold text-muted-foreground">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Precio de ${item.name}`}
                    value={draftValue}
                    onChange={(e) => {
                      const sanitized = e.target.value.replace(/,/g, ".");
                      if (/^[0-9]*\.?[0-9]{0,2}$/.test(sanitized)) {
                        onDraftPriceChange(item.productId, sanitized);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onSavePrice(item);
                      }
                    }}
                    placeholder="0"
                    className={cn(
                      "h-11 min-h-[44px] w-28 sm:w-32 rounded-xl border bg-surface pl-6 pr-10 text-xs sm:text-sm font-semibold tabular-nums text-foreground placeholder:text-muted-foreground caret-brand-gold focus:outline-none transition-all",
                      isDirty
                        ? "border-amber-500/70 bg-amber-500/5 ring-1 ring-amber-500/40 focus:border-amber-400 focus:ring-amber-400"
                        : "border-outline focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                    )}
                  />
                  <span className="pointer-events-none absolute right-2.5 text-[11px] font-medium text-muted-foreground">
                    {unitSuffix}
                  </span>
                </div>

                {isDirty && (
                  <button
                    type="button"
                    aria-label={`Revertir precio de ${item.name}`}
                    title="Revertir cambios al valor guardado"
                    onClick={() => onDraftPriceChange(item.productId, savedPriceStr)}
                    className="size-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-outline bg-surface text-muted-foreground hover:text-foreground hover:border-zinc-500 cursor-pointer shrink-0 transition-colors focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
                  >
                    <Undo2 className="size-4" aria-hidden="true" />
                  </button>
                )}

                <Button
                  type="button"
                  aria-label={`Guardar precio de ${item.name}`}
                  onClick={() => onSavePrice(item)}
                  disabled={isSaving}
                  className={cn(
                    "h-11 min-h-[44px] px-3.5 text-xs font-semibold gap-1.5 shrink-0 transition-all focus-visible:ring-2 focus-visible:ring-brand-gold",
                    isDirty &&
                      "bg-brand-gold text-brand-dark hover:bg-brand-gold-hover shadow-lg shadow-brand-gold/20"
                  )}
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  <span>Guardar</span>
                </Button>
              </div>

              {/* 100g fraction equivalence hint for bulk products */}
              {item.saleUnit === "WEIGHT" && (
                <span className="text-[11px] text-brand-muted font-medium tabular-nums pl-1 mt-1 block">
                  {Number(draftValue || item.price || 0) > 0
                    ? reference === 100
                      ? `Equiv. ${formatPrice(toPricePerKg(Number(draftValue || 0), 100))} / kg`
                      : `Equiv. ${formatPrice(calculatePortionPrice(Number(draftValue || 0), "100g"))} / 100g`
                    : `Ingresá precio por ${formatWeight(reference)}`}
                  {isDirty && (
                    <span className="ml-1.5 text-amber-400 font-semibold text-[10px] uppercase tracking-wider">
                      · Sin guardar
                    </span>
                  )}
                </span>
              )}
            </div>

            {/* Operational Actions (Destacar, Oferta, Pausar/Activar) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={
                  item.isFeatured
                    ? `Quitar de destacados a ${item.name}`
                    : `Destacar ${item.name}`
                }
                title={
                  isConfigured
                    ? item.isFeatured
                      ? "Quitar de destacados en esta sucursal"
                      : "Marcar como destacado en esta sucursal"
                    : "Guardá primero un precio base para destacar"
                }
                disabled={!isConfigured || isSaving}
                onClick={() => onToggleFeatured(item)}
                className={cn(
                  "size-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none",
                  item.isFeatured
                    ? "border-brand-gold bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25"
                    : "border-outline bg-surface text-foreground/80 hover:border-brand-gold/50 hover:text-foreground"
                )}
              >
                <Star
                  className={cn("size-4", item.isFeatured && "fill-brand-gold")}
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                aria-label={
                  item.isOnSale
                    ? `Editar oferta de ${item.name}`
                    : `Configurar oferta para ${item.name}`
                }
                title={
                  isConfigured
                    ? item.isOnSale
                      ? `Oferta activa: ${formatPrice(displayPrice(item.promotionalPrice ?? 0))} (clic para editar)`
                      : "Configurar oferta para este producto"
                    : "Guardá primero un precio base para habilitar ofertas"
                }
                disabled={!isConfigured}
                onClick={() => onOpenOfferModal(item)}
                className={cn(
                  "size-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none",
                  item.isOnSale
                    ? "border-brand-gold bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25"
                    : "border-outline bg-surface text-foreground/80 hover:border-brand-gold/50 hover:text-foreground"
                )}
              >
                <Tag className="size-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onToggleAvailability(item)}
                disabled={isSaving}
                aria-label={
                  item.isAvailable ? `Pausar ${item.name}` : `Activar ${item.name}`
                }
                title={
                  item.isAvailable
                    ? "Pausar producto en esta sucursal"
                    : "Activar producto en esta sucursal"
                }
                className={cn(
                  "h-11 min-h-[44px] inline-flex items-center justify-center rounded-xl border px-3.5 text-xs font-semibold transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none",
                  item.isAvailable
                    ? "border-outline bg-surface text-foreground/80 hover:border-amber-500/40 hover:text-amber-300"
                    : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                )}
              >
                {item.isAvailable ? "Pausar" : "Activar"}
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
});
