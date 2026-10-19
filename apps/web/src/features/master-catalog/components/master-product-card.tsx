import { Barcode, Edit3, Hash, Layers, Scale } from "lucide-react";
import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import { cn } from "@/lib/utils/cn";
import type { MasterProduct } from "../types";

export interface MasterProductCardProps {
  product: MasterProduct;
  categoryLabel: string;
  isToggling: boolean;
  onEdit: (product: MasterProduct) => void;
  onToggleActive: (product: MasterProduct) => void;
}

export function MasterProductCard({
  product,
  categoryLabel,
  isToggling,
  onEdit,
  onToggleActive,
}: MasterProductCardProps) {
  const hasImage = product.imageUrls && product.imageUrls.length > 0;

  return (
    <article
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-surface-card p-4 transition-all hover:border-outline-variant",
        product.isActive
          ? "border-outline"
          : "border-amber-500/30 bg-amber-500/[0.02] opacity-80"
      )}
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Thumbnail */}
        <div className="size-14 sm:size-16 rounded-xl overflow-hidden bg-surface border border-outline flex items-center justify-center shrink-0">
          <img
            src={hasImage ? product.imageUrls[0] : DEFAULT_PRODUCT_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/Logo.jpeg";
            }}
          />
        </div>

        {/* Metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-elevated text-zinc-300 shrink-0 whitespace-nowrap">
              <Layers className="size-3 text-brand-gold shrink-0" />
              <span>{categoryLabel}</span>
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono border shrink-0 whitespace-nowrap",
                product.saleUnit === "WEIGHT"
                  ? "bg-brand-gold/10 text-brand-gold border-brand-gold/25"
                  : "bg-sky-500/10 text-sky-300 border-sky-500/25"
              )}
            >
              <Scale className="size-3 shrink-0" />
              <span>
                {product.saleUnit === "WEIGHT"
                  ? "Granel · Venta por kg"
                  : "Por Unidad"}
              </span>
            </span>

            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono shrink-0 whitespace-nowrap",
                product.isActive
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/15 text-amber-300"
              )}
            >
              {product.isActive ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>

          <h3 className="font-headline text-sm sm:text-base font-bold text-white truncate">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-zinc-400 line-clamp-1">
              {product.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-zinc-400 font-mono">
            {product.code && (
              <span className="inline-flex items-center gap-1">
                <Hash className="size-3 text-zinc-500" />
                Cód: <strong className="text-zinc-200">{product.code}</strong>
              </span>
            )}
            {product.barcode && (
              <span className="inline-flex items-center gap-1">
                <Barcode className="size-3 text-zinc-500" />
                EAN: <strong className="text-zinc-200">{product.barcode}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline/60">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-outline bg-surface px-3.5 text-xs font-semibold text-zinc-200 hover:border-brand-gold hover:text-white transition-colors cursor-pointer"
        >
          <Edit3 className="size-3.5 text-brand-gold" />
          <span>Editar</span>
        </button>

        <button
          type="button"
          disabled={isToggling}
          onClick={() => onToggleActive(product)}
          className={cn(
            "inline-flex min-h-[44px] items-center justify-center rounded-xl border px-3.5 text-xs font-semibold transition-colors cursor-pointer",
            product.isActive
              ? "border-outline bg-surface text-zinc-300 hover:border-amber-500/40 hover:text-amber-300"
              : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
          )}
        >
          {product.isActive ? "Desactivar" : "Reactivar"}
        </button>
      </div>
    </article>
  );
}
