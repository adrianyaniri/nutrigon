import { AlertCircle, Percent, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BranchProductAdminItem } from "@/features/pricing/data/branch-pricing-repository";
import { useDialogFocusTrap } from "@/hooks";
import { formatPrice } from "@/lib/format/price";
import {
  getPriceReferenceGrams,
  formatWeight,
  referencePrice,
} from "../lib/portion-pricing";

export interface BranchOfferModalProps {
  item: BranchProductAdminItem | null;
  promoPriceInput: string;
  onPromoPriceInputChange: (value: string) => void;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onActivateOffer: () => void;
  onRemoveOffer: () => void;
}

export function BranchOfferModal({
  item,
  promoPriceInput,
  onPromoPriceInputChange,
  error,
  isSaving,
  onClose,
  onActivateOffer,
  onRemoveOffer,
}: BranchOfferModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen: Boolean(item),
    onClose,
    initialFocusSelector: "#promoPriceField",
  });

  if (!item) return null;
  const unit =
    item.saleUnit === "WEIGHT" ? formatWeight(getPriceReferenceGrams(item)) : "unidad";
  const regular =
    item.saleUnit === "WEIGHT"
      ? referencePrice(item.price ?? 0, item)
      : (item.price ?? 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-outline bg-surface-card p-6 shadow-2xl space-y-5 overscroll-contain"
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center -mt-2 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-gold-text">
              <Percent className="size-3.5" /> Promoción de Sucursal
            </span>
            <h2
              id="offer-modal-title"
              className="font-headline text-lg font-bold text-foreground mt-0.5"
            >
              {item.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de oferta"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="rounded-xl border border-outline/60 bg-surface p-3.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Precio regular (por {unit}):</span>
          <span className="font-headline text-sm font-bold text-foreground">
            {formatPrice(regular)} / {unit}
          </span>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="promoPriceField"
            className="block text-xs font-semibold text-foreground"
          >
            Precio promocional de oferta ($ / {unit})
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-sm font-bold text-brand-gold-text">
              $
            </span>
            <input
              id="promoPriceField"
              type="number"
              min="0.01"
              step="0.01"
              value={promoPriceInput}
              onChange={(e) => onPromoPriceInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onActivateOffer();
                }
              }}
              placeholder="Ej: 12500"
              className="min-h-[46px] w-full rounded-xl border border-outline bg-surface pl-8 pr-16 text-sm font-bold text-foreground placeholder:text-muted-foreground caret-brand-gold focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
            {item.price &&
              Number(promoPriceInput) > 0 &&
              Number(promoPriceInput) < regular && (
                <span className="absolute right-3 rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-bold text-brand-gold-text">
                  -{Math.round(((regular - Number(promoPriceInput)) / regular) * 100)}%
                </span>
              )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            En el catálogo público se mostrará el precio regular tachado junto con la
            insignia de <strong className="text-brand-gold-text">Oferta</strong>.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-status-destructive/30 bg-status-destructive/10 p-3 text-xs text-status-destructive"
          >
            <AlertCircle className="size-4 shrink-0 text-status-destructive" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
          {item.isOnSale && (
            <Button
              type="button"
              variant="outline"
              onClick={onRemoveOffer}
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[44px] border-status-destructive/40 text-status-destructive hover:bg-status-destructive/15"
            >
              Quitar oferta
            </Button>
          )}

          <Button
            type="button"
            onClick={onActivateOffer}
            disabled={isSaving}
            className="w-full sm:w-auto min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold-hover font-bold"
          >
            {item.isOnSale ? "Guardar oferta" : "Activar oferta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
