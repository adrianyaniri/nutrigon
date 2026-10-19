import { AlertCircle, Check, MapPin, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogFocusTrap } from "@/hooks";
import { cn } from "@/lib/utils/cn";
import type { CatalogBranch } from "../types";

export interface BranchPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: readonly CatalogBranch[];
  currentBranchSlug: string;
  onSelectBranch: (branchSlug: string) => void;
  cartItemCount: number;
}

const BRANCH_METADATA: Record<string, { address: string; hours: string }> = {
  centro: {
    address: "San Martín 450 (Centro)",
    hours: "Lun a Vie 8:30 a 20:30 · Sáb 9:00 a 14:00",
  },
  norte: {
    address: "Av. Libertad 1200",
    hours: "Lun a Vie 9:00 a 20:00 · Sáb 9:00 a 13:30",
  },
  sur: {
    address: "Belgrano 890",
    hours: "Lun a Vie 8:30 a 20:00 · Sáb 9:00 a 13:30",
  },
};

export function BranchPickerModal({
  isOpen,
  onClose,
  branches,
  currentBranchSlug,
  onSelectBranch,
  cartItemCount,
}: BranchPickerModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
              <Store className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="branch-modal-title" className="font-headline text-lg font-bold text-foreground">
                Seleccionar Sucursal
              </h2>
              <p className="text-xs text-muted-foreground">
                Precios y pedidos por WhatsApp específicos de cada local
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {cartItemCount > 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
            <AlertCircle className="size-4 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-amber-300">Atención: </span>
              Tenés {cartItemCount} {cartItemCount === 1 ? "producto" : "productos"} en tu pedido.
              Al cambiar de sucursal se vaciará el carrito, ya que los precios y disponibilidad son
              propios de cada sucursal.
            </div>
          </div>
        )}

        <div className="mt-4 space-y-2.5" role="radiogroup" aria-label="Sucursales disponibles">
          {branches.map((branch) => {
            const isSelected = branch.slug === currentBranchSlug;
            const meta = BRANCH_METADATA[branch.slug] ?? {
              address: `Sucursal ${branch.name}`,
              hours: "Consulte horarios de atención",
            };

            return (
              <button
                key={branch.slug}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  onSelectBranch(branch.slug);
                  onClose();
                }}
                className={cn(
                  "w-full text-left rounded-xl border p-4 transition-all min-h-[56px]",
                  "flex items-center justify-between gap-3",
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
                    : "border-border bg-brand-surface/40 hover:border-brand-gold/40 hover:bg-brand-surface/80"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-semibold text-sm sm:text-base text-foreground">
                      Sucursal {branch.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <Check className="size-3" />
                        Activa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3 text-brand-gold shrink-0" aria-hidden="true" />
                    <span>{meta.address}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80">{meta.hours}</p>
                </div>

                <div className="shrink-0 text-xs font-semibold text-brand-gold">
                  {isSelected ? "Seleccionada" : "Elegir →"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
