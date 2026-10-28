import { AlertCircle, Percent, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BranchProductAdminItem } from "@/features/pricing/data/branch-pricing-repository";
import { useDialogFocusTrap } from "@/hooks";
import { formatPrice } from "@/lib/format/price";
import {
  calculatePortionPrice,
  formatWeight,
  getPriceReferenceGrams,
  portionFromGrams,
  referencePrice,
} from "../lib/portion-pricing";

export interface BranchOfferModalProps {
  item: BranchProductAdminItem | null;
  promoPriceInput: string;
  onPromoPriceInputChange: (value: string) => void;
  offerMode: "ALL" | "WEIGHT";
  onOfferModeChange: (mode: "ALL" | "WEIGHT") => void;
  weightOfferInputs: Record<number, string>;
  onWeightOfferInputChange: (weightGrams: number, value: string) => void;
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
  offerMode,
  onOfferModeChange,
  weightOfferInputs,
  onWeightOfferInputChange,
  error,
  isSaving,
  onClose,
  onActivateOffer,
  onRemoveOffer,
}: BranchOfferModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen: Boolean(item),
    onClose,
    initialFocusSelector:
      offerMode === "WEIGHT" ? "[data-weight-offer-input]" : "#promoPriceField",
  });

  if (!item) return null;
  const isWeight = item.saleUnit === "WEIGHT";
  const unit = isWeight ? formatWeight(getPriceReferenceGrams(item)) : "unidad";
  const regular = isWeight
    ? referencePrice(item.price ?? 0, item)
    : (item.price ?? 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative z-10 max-h-[92dvh] w-full max-w-md space-y-5 overflow-y-auto overscroll-contain rounded-t-3xl border border-outline bg-surface-card p-6 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-center pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-gold-text">
              <Percent className="size-3.5" /> Promoción de sucursal
            </span>
            <h2
              id="offer-modal-title"
              className="mt-0.5 font-headline text-lg font-bold text-foreground"
            >
              {item.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de oferta"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-outline/60 bg-surface p-3.5 text-xs">
          <span className="text-muted-foreground">Precio regular (por {unit}):</span>
          <span className="font-headline text-sm font-bold text-foreground">
            {formatPrice(regular)} / {unit}
          </span>
        </div>

        {isWeight && (
          <div
            role="radiogroup"
            aria-label="Alcance de la oferta"
            className="grid grid-cols-2 gap-2"
          >
            {([
              ["ALL", "Todos los gramajes"],
              ["WEIGHT", "Gramajes específicos"],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={offerMode === mode}
                onClick={() => onOfferModeChange(mode)}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                  offerMode === mode
                    ? "border-brand-gold bg-brand-gold/15 text-brand-gold-text"
                    : "border-outline bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {offerMode === "ALL" || !isWeight ? (
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
                onChange={(event) => onPromoPriceInputChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onActivateOffer();
                  }
                }}
                placeholder="Ej: 12500"
                className="min-h-[46px] w-full rounded-xl border border-outline bg-surface pl-8 pr-16 text-sm font-bold text-foreground caret-brand-gold placeholder:text-muted-foreground focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
              {item.price &&
                Number(promoPriceInput) > 0 &&
                Number(promoPriceInput) < regular && (
                  <span className="absolute right-3 rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-bold text-brand-gold-text">
                    -{Math.round(((regular - Number(promoPriceInput)) / regular) * 100)}%
                  </span>
                )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cargá el precio final solamente en los gramajes que estarán en oferta.
            </p>
            <div className="space-y-2">
              {(item.weightOptionsGrams ?? []).map((weightGrams) => {
                const regularPortionPrice = calculatePortionPrice(
                  item.price ?? 0,
                  portionFromGrams(weightGrams)
                );
                return (
                  <label
                    key={weightGrams}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.8fr)] items-center gap-3 rounded-xl border border-outline/60 bg-surface p-3"
                  >
                    <span className="min-w-0 text-xs text-foreground">
                      <strong>{formatWeight(weightGrams)}</strong>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        Regular {formatPrice(regularPortionPrice)}
                      </span>
                    </span>
                    <span className="relative flex items-center">
                      <span className="pointer-events-none absolute left-3 text-sm font-bold text-brand-gold-text">
                        $
                      </span>
                      <input
                        data-weight-offer-input
                        aria-label={`Precio promocional para ${formatWeight(weightGrams)}`}
                        type="number"
                        min="0.01"
                        max={regularPortionPrice}
                        step="0.01"
                        value={weightOfferInputs[weightGrams] ?? ""}
                        onChange={(event) =>
                          onWeightOfferInputChange(weightGrams, event.target.value)
                        }
                        placeholder="Sin oferta"
                        className="min-h-[44px] w-full rounded-lg border border-outline bg-surface-card pl-7 pr-2 text-sm font-bold text-foreground caret-brand-gold placeholder:text-muted-foreground focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          En el catálogo público se mostrará el precio regular tachado únicamente donde
          corresponda, junto con la insignia de{" "}
          <strong className="text-brand-gold-text">Oferta</strong>.
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-status-destructive/30 bg-status-destructive/10 p-3 text-xs text-status-destructive"
          >
            <AlertCircle className="size-4 shrink-0 text-status-destructive" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col items-center justify-end gap-2.5 pt-2 sm:flex-row">
          {item.isOnSale && (
            <Button
              type="button"
              variant="outline"
              onClick={onRemoveOffer}
              disabled={isSaving}
              className="min-h-[44px] w-full border-status-destructive/40 text-status-destructive hover:bg-status-destructive/15 sm:w-auto"
            >
              Quitar oferta
            </Button>
          )}

          <Button
            type="button"
            onClick={onActivateOffer}
            disabled={isSaving}
            className="min-h-[44px] w-full bg-brand-gold font-bold text-brand-dark hover:bg-brand-gold-hover sm:w-auto"
          >
            {item.isOnSale ? "Guardar oferta" : "Activar oferta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
