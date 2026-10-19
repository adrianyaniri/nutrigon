import { useEffect, useId, useMemo, useState } from "react";
import { Check, CheckCircle2, ShieldCheck, ShoppingBag, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/atoms/product-image";
import { useCart } from "@/features/cart";
import {
  calculatePortionPrice,
  PORTION_OPTIONS,
  type WeightPortion,
} from "@/features/catalog/lib/portion-pricing";
import { getEffectivePrice } from "@/features/catalog/lib/filter-products";
import type { CatalogBranch, CatalogCategory, CatalogProduct } from "../types";
import { useDialogFocusTrap } from "@/hooks";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CatalogProduct | null;
  branch?: CatalogBranch | null;
  categories: readonly CatalogCategory[];
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  branch,
  categories,
}: ProductModalProps) {
  const { addProduct } = useCart();
  const [selectedPortion, setSelectedPortion] = useState<WeightPortion>("250g");
  const [quantity, setQuantity] = useState(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });
  const modalTitleId = useId();

  // Reset state when opening a new product
  useEffect(() => {
    if (isOpen) {
      setSelectedPortion("250g");
      setQuantity(1);
      setIsAddedFeedback(false);
    }
  }, [isOpen, product?.id]);

  const categoryName = useMemo(() => {
    if (!product) return "Dietética";
    if (product.isCombo) return "Combo Especial";
    const cat = categories.find((c) => c.id === product.categoryId);
    return cat ? cat.name : "Dietética";
  }, [product, categories]);

  if (!isOpen || !product) return null;

  const isWeight = product.saleUnit === "WEIGHT" && !product.isCombo;
  const baseEffectivePrice = getEffectivePrice(product);
  const unitCalculatedPrice = isWeight
    ? calculatePortionPrice(baseEffectivePrice, selectedPortion)
    : baseEffectivePrice;
  const totalPrice = unitCalculatedPrice * quantity;

  function handleAddToCart() {
    if (!product) return;
    const branchSlug = branch?.slug ?? "centro";
    addProduct(branchSlug, product.id, quantity, isWeight ? selectedPortion : undefined);

    setIsAddedFeedback(true);
    setTimeout(() => {
      setIsAddedFeedback(false);
      onClose();
    }, 700);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card (Dual-Canvas: Bottom-sheet on mobile, centered split on desktop) */}
      <div
        ref={modalRef}
        className={cn(
          "relative z-10 flex w-full max-w-4xl flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-card shadow-2xl overflow-hidden max-h-[92dvh] sm:max-h-[85vh]",
          "animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        )}
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de producto"
          className="absolute right-4 top-4 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors backdrop-blur-sm active:scale-95 border border-border/60"
        >
          <X className="size-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 overflow-y-auto overscroll-contain">
          {/* Left Column: Visual & Organic Authenticity Badges */}
          <div className="md:col-span-5 relative bg-brand-surface/40 border-b md:border-b-0 md:border-r border-border p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="relative aspect-square sm:aspect-4/3 md:aspect-square w-full rounded-2xl overflow-hidden bg-brand-surface border border-border shadow-sm">
                <ProductImage src={product.imageUrl} alt={product.name} />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card/85 backdrop-blur-md border border-border text-[11px] font-medium text-foreground shadow-xs">
                  <Store className="size-3.5 text-primary" />
                  <span>Sucursal {branch?.name ?? "Nutrigon"}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {product.description ??
                  "Frutos secos y alimentos naturales seleccionados. Venta a granel fraccionada en envase termosellado para conservar aroma, textura y frescura máxima."}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center gap-2 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <span>Stock fresco garantizado · Balanza comercial INTI</span>
            </div>
          </div>

          {/* Right Column: Customization Flow & Portion Stepper */}
          <div className="md:col-span-7 p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              {/* Category & Title */}
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-primary">
                  {categoryName}
                </span>
                <h2
                  id={modalTitleId}
                  className="font-headline text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-1"
                >
                  {product.name}
                </h2>
                <div className="flex flex-wrap items-baseline gap-2.5 mt-2">
                  <span className="font-headline text-2xl sm:text-3xl font-black text-primary tracking-tight">
                    {formatPrice(unitCalculatedPrice)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {product.isCombo
                      ? "Precio por combo completo"
                      : isWeight
                        ? `Por ${selectedPortion} · Precio por 1 kg: ${formatPrice(baseEffectivePrice)}`
                        : "Precio por unidad"}
                  </span>
                </div>
              </div>

              {/* Included items for Combos */}
              {product.isCombo && product.comboItems && product.comboItems.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-border bg-brand-surface/40 p-3.5">
                  <span className="block text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                    Productos incluidos en el combo
                  </span>
                  <ul className="space-y-1.5 text-xs text-foreground">
                    {product.comboItems.map((item) => (
                      <li key={item.productId} className="flex items-center justify-between">
                        <span>{item.productName}</span>
                        <span className="font-semibold text-primary">
                          {item.quantity} {item.saleUnit === "WEIGHT" ? "kg" : "un."}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weight Portion Selector (for WEIGHT products) */}
              {isWeight && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                      Seleccionar gramaje
                    </label>
                    <span className="text-xs font-semibold text-primary">
                      {selectedPortion} seleccionados
                    </span>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Opciones de gramaje"
                    className="grid grid-cols-2 gap-2 sm:gap-2.5"
                  >
                    {PORTION_OPTIONS.map((option) => {
                      const isSelected = selectedPortion === option.value;
                      const optPrice = calculatePortionPrice(baseEffectivePrice, option.value);

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedPortion(option.value)}
                          className={cn(
                            "flex flex-col justify-between p-3 rounded-xl border text-left transition-all active:scale-[0.98]",
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                              : "border-border bg-brand-surface/40 text-muted-foreground hover:border-border/80 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={cn(
                                "font-headline text-sm font-bold",
                                isSelected ? "text-primary" : "text-foreground"
                              )}
                            >
                              {option.label}
                            </span>
                            {isSelected && (
                              <Check className="size-4 text-primary" aria-hidden="true" />
                            )}
                          </div>

                          <div className="flex items-center justify-between w-full mt-2">
                            <span
                              className={cn(
                                "font-headline text-xs font-semibold tabular-nums",
                                isSelected ? "text-primary font-bold" : "text-muted-foreground"
                              )}
                            >
                              {formatPrice(optPrice)}
                            </span>
                            {option.badge && (
                              <span
                                className={cn(
                                  "text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-brand-surface/40">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-headline text-xs font-bold text-foreground">
                    {isWeight ? "Cantidad de paquetes" : "Cantidad"}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {isWeight
                      ? `Bolsas termoselladas de ${selectedPortion}`
                      : "Unidades para el pedido"}
                  </span>
                </div>

                {/* Tactile Counter (min 44px touch) */}
                <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    aria-label="Disminuir paquetes"
                    disabled={quantity <= 1}
                    className="min-h-[44px] min-w-[44px] size-11 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 disabled:opacity-40 transition-all"
                  >
                    <span className="text-base font-bold leading-none">−</span>
                  </button>
                  <span className="w-9 text-center font-headline text-sm font-bold tabular-nums text-foreground select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => prev + 1)}
                    aria-label="Aumentar paquetes"
                    className="min-h-[44px] min-w-[44px] size-11 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                  >
                    <span className="text-base font-bold leading-none">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Add Action & Total */}
            <div className="pt-4 border-t border-border space-y-2.5">
              <Button
                type="button"
                onClick={handleAddToCart}
                className={cn(
                  "w-full min-h-[48px] rounded-xl font-headline font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 shadow-lg shadow-brand-gold/15 active:scale-[0.99] transition-all",
                  isAddedFeedback
                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                    : "bg-primary text-primary-foreground hover:bg-brand-gold-hover"
                )}
              >
                {isAddedFeedback ? (
                  <>
                    <Check className="size-5" />
                    <span>✓ ¡Agregado al pedido!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="size-5" />
                    <span>
                      Agregar al Pedido · {formatPrice(totalPrice)}
                    </span>
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-center text-muted-foreground text-[11px]">
                <ShieldCheck className="size-3.5 text-primary shrink-0" />
                <span>Fraccionado higiénico con balanza certificada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
