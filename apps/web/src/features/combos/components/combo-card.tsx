import { Trash2 } from "lucide-react";
import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";
import type { BranchComboAdminItem } from "../types";

export interface ComboCardProps {
  combo: BranchComboAdminItem;
  isToggling: boolean;
  isDeleting: boolean;
  onToggleAvailability: (combo: BranchComboAdminItem) => void;
  onRequestDelete: (combo: BranchComboAdminItem) => void;
}

export function ComboCard({
  combo,
  isToggling,
  isDeleting,
  onToggleAvailability,
  onRequestDelete,
}: ComboCardProps) {
  const hasImage = combo.imageUrls && combo.imageUrls.length > 0;

  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-2xl border bg-surface-card p-4 transition-all hover:border-outline-variant",
        combo.isAvailable
          ? "border-outline"
          : "border-amber-500/30 bg-amber-500/[0.02]"
      )}
    >
      <div className="space-y-3">
        {/* Image & Status Badge */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-surface border border-outline/60 flex items-center justify-center">
          <img
            src={hasImage ? combo.imageUrls[0] : DEFAULT_PRODUCT_IMAGE}
            alt={combo.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = "/Logo.jpeg";
            }}
          />

          {!hasImage && (
            <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-[11px] text-brand-gold px-2 py-0.5 rounded-full font-mono border border-brand-gold/30">
              Imagen por defecto
            </span>
          )}

          <div className="absolute top-2 right-2">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border",
                combo.isAvailable
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              )}
            >
              {combo.isAvailable ? "DISPONIBLE" : "PAUSADO"}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-headline text-base font-bold text-white line-clamp-1">
            {combo.name}
          </h3>
          {combo.description && (
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
              {combo.description}
            </p>
          )}
        </div>

        {/* Included Items */}
        <div className="rounded-xl bg-surface border border-outline/60 p-3 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
            Contenido ({combo.items.length} productos):
          </span>
          <ul className="space-y-1 text-xs text-zinc-300">
            {combo.items.map((item, idx) => {
              const qtyLabel =
                item.saleUnit === "WEIGHT"
                  ? item.quantity < 1
                    ? `${Math.round(item.quantity * 1000)} g`
                    : `${item.quantity} kg`
                  : `${item.quantity} un.`;

              return (
                <li key={idx} className="flex items-center justify-between text-xs">
                  <span className="truncate pr-2 font-medium">{item.productName}</span>
                  <span className="shrink-0 text-white font-mono text-[11px] bg-surface-elevated px-1.5 py-0.5 rounded">
                    {qtyLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Footer with Price & Actions */}
      <div className="mt-4 pt-3 border-t border-outline flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] uppercase font-mono text-zinc-400">Precio combo</span>
          <p className="font-headline text-lg font-bold text-brand-gold">
            {formatPrice(combo.price)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleAvailability(combo)}
            disabled={isToggling}
            className={cn(
              "min-h-[40px] px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
              combo.isAvailable
                ? "border-outline bg-surface text-zinc-300 hover:text-amber-300 hover:border-amber-500/40"
                : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
            )}
            title={combo.isAvailable ? "Pausar este combo" : "Habilitar para el público"}
          >
            {combo.isAvailable ? "Pausar" : "Activar"}
          </button>

          <button
            type="button"
            onClick={() => onRequestDelete(combo)}
            disabled={isDeleting}
            className="min-h-[40px] p-2.5 rounded-xl border border-outline bg-surface text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
            title="Eliminar combo"
            aria-label={`Eliminar combo ${combo.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
