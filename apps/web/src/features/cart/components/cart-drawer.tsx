import { useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Send,
  ShoppingBag,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/atoms/product-image";
import { useCart } from "@/features/cart";
import {
  buildWhatsAppOrderUrl,
  formatWhatsAppOrderMessage,
  type OrderItem,
} from "@/features/cart/lib/format-order-message";
import { getEffectivePrice } from "@/features/catalog/lib/filter-products";
import type { CatalogBranch, CatalogProduct, SaleUnit } from "@/features/catalog/types";
import { useDialogFocusTrap } from "@/hooks";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

import {
  calculatePortionPrice,
  getPortionOptions,
  portionGrams,
  formatWeight,
  multiplyPrice,
  sumPrices,
} from "@/features/catalog/lib/portion-pricing";

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: CatalogBranch | null;
  products: readonly CatalogProduct[];
}

function describeSaleUnit(unit: SaleUnit): string {
  return unit === "WEIGHT" ? "Peso sin seleccionar" : "Unidad";
}

function hasValidPortion(product: CatalogProduct, portion?: string): boolean {
  if (product.saleUnit !== "WEIGHT") return !portion;
  if (!portion) return false;
  try {
    const grams = portionGrams(portion);
    return getPortionOptions(product).some(
      (option) => portionGrams(option.value) === grams
    );
  } catch {
    return false;
  }
}

export function CartDrawer({ isOpen, onClose, branch, products }: CartDrawerProps) {
  const { state, itemCount, addProduct, decrementProduct, removeProduct, clear } =
    useCart();
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const drawerRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const nameInputId = useId();
  const notesInputId = useId();
  const fulfillmentLabelId = useId();

  // Map cart lines to rich catalog items
  const cartItems = useMemo(() => {
    const productMap = new Map(products.map((p) => [p.id, p]));
    return state.lines
      .map((line) => {
        const product = productMap.get(line.productId);
        if (!product) return null;
        const basePrice = getEffectivePrice(product);
        const isValid = hasValidPortion(product, line.portion);
        const unitPrice = !isValid
          ? 0
          : product.saleUnit === "WEIGHT" && line.portion
            ? calculatePortionPrice(basePrice, line.portion)
            : basePrice;
        const lineTotal = multiplyPrice(unitPrice, line.quantity);
        return {
          isValid,
          product,
          quantity: line.quantity,
          portion: line.portion,
          unitPrice,
          lineTotal,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [state.lines, products]);

  const totalAmount = useMemo(
    () => sumPrices(cartItems.map((item) => item.lineTotal)),
    [cartItems]
  );

  if (!isOpen) return null;

  const hasInvalidItems =
    cartItems.length !== state.lines.length || cartItems.some((item) => !item.isValid);

  const branchName = branch?.name ?? "Principal";

  function handleSendWhatsApp() {
    if (hasInvalidItems || !cartItems.length) return;
    const orderItems: OrderItem[] = cartItems.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      saleUnit: item.product.saleUnit,
      portion: item.portion,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    }));

    const message = formatWhatsAppOrderMessage({
      branchName,
      items: orderItems,
      total: totalAmount,
      fulfillment,
      customerName,
      notes,
    });

    const whatsappUrl = buildWhatsAppOrderUrl(branch?.whatsappNumber, message);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    clear();
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 flex justify-end"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        ref={drawerRef}
        className={cn(
          "relative z-10 flex h-full w-full max-w-lg md:max-w-xl flex-col border-l border-border bg-card shadow-2xl overscroll-contain",
          "animate-in slide-in-from-right duration-200 motion-reduce:animate-none"
        )}
      >
        {/* Top Header */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar pedido"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95"
            >
              <ArrowLeft className="size-5 md:hidden" />
              <X className="hidden size-5 md:block" />
            </button>
            <div className="flex items-center gap-2">
              <h2
                id="cart-drawer-title"
                className="font-headline text-lg font-bold tracking-tight text-foreground"
              >
                Tu Pedido
              </h2>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {itemCount} {itemCount === 1 ? "ítem" : "ítems"}
              </span>
            </div>
          </div>

          {itemCount > 0 &&
            (isConfirmingClear ? (
              <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label="Confirmar vaciado de carrito"
              >
                <button
                  type="button"
                  onClick={() => setIsConfirmingClear(false)}
                  className="min-h-[38px] rounded-lg px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clear();
                    setIsConfirmingClear(false);
                  }}
                  aria-label="Confirmar vaciar carrito"
                  className="min-h-[38px] rounded-lg bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  Sí, vaciar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingClear(true)}
                aria-label="Vaciar carrito"
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors active:scale-95"
              >
                <Trash2 className="size-4" />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            ))}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 space-y-5">
          {/* Branch Context Banner */}
          <div className="rounded-xl border border-brand-border/70 bg-brand-surface/70 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Store className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Punto de despacho
                  </p>
                  <p className="truncate text-xs font-bold text-foreground">
                    Sucursal {branchName}
                  </p>
                </div>
              </div>

              {branch?.address && (
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[180px]">
                  <MapPin className="size-3 text-primary shrink-0" />
                  <span className="truncate">{branch.address}</span>
                </div>
              )}
            </div>
          </div>

          {hasInvalidItems && (
            <p
              role="alert"
              className="rounded-xl border border-destructive p-3 text-sm text-foreground"
            >
              Revisá las cantidades: hay productos o pesos que ya no están disponibles.
              Eliminá los ítems afectados y volvé a elegirlos en el catálogo antes de
              enviar el pedido.
            </p>
          )}
          {/* Cart Items List */}
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4">
                <ShoppingBag className="size-7" />
              </div>
              <h3 className="font-headline text-base font-bold text-foreground">
                Tu pedido está vacío
              </h3>
              <p className="mt-1.5 max-w-xs text-xs text-muted-foreground leading-relaxed">
                Elegí frutos secos, harinas o semillas en el catálogo para armar tu
                pedido.
              </p>
              <Button
                variant="outline"
                className="mt-5 min-h-[44px] text-xs font-semibold"
                onClick={onClose}
              >
                Continuar navegando
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Productos seleccionados
              </p>

              <div className="divide-y divide-border/60 rounded-2xl border border-border bg-brand-surface/30 overflow-hidden">
                {cartItems.map(
                  ({ product, quantity, portion, unitPrice, lineTotal, isValid }) => (
                    <div
                      key={portion ? `${product.id}:${portion}` : product.id}
                      className="flex items-center gap-3 p-3 sm:p-4 transition-colors hover:bg-brand-surface/60"
                    >
                      <div className="size-16 sm:size-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-brand-surface">
                        <ProductImage src={product.imageUrl} alt={product.name} />
                      </div>

                      <div className="flex flex-1 flex-col justify-between min-w-0 py-0.5">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <h4 className="font-headline text-xs sm:text-sm font-bold text-foreground truncate">
                              {product.name}
                            </h4>
                            <span className="mt-0.5 inline-block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {portion
                                ? `Granel · ${portion}`
                                : describeSaleUnit(product.saleUnit)}{" "}
                              ·{" "}
                              {isValid
                                ? formatPrice(unitPrice)
                                : "Cantidad no disponible"}
                            </span>
                            {isValid && product.saleUnit === "WEIGHT" && portion && (
                              <span className="block text-xs text-muted-foreground">
                                {quantity} × {formatWeight(portionGrams(portion))} ·{" "}
                                {formatWeight(portionGrams(portion) * quantity)} en total
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeProduct(product.id, portion)}
                            aria-label={`Eliminar ${product.name}`}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center -mr-2 text-muted-foreground hover:text-destructive transition-colors active:scale-90"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          {/* Stepper (min 44px touch area) */}
                          <div className="inline-flex items-center rounded-full border border-border bg-card shadow-2xs">
                            <button
                              type="button"
                              onClick={() => decrementProduct(product.id, portion)}
                              aria-label={`Disminuir cantidad de ${product.name}`}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                            >
                              <span className="text-base font-bold leading-none">−</span>
                            </button>
                            <span className="min-w-6 px-1 text-center text-xs font-bold tabular-nums text-foreground select-none">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (branch?.slug)
                                  addProduct(branch.slug, product.id, 1, portion);
                              }}
                              aria-label={`Aumentar cantidad de ${product.name}`}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
                            >
                              <span className="text-base font-bold leading-none">+</span>
                            </button>
                          </div>

                          <span className="font-headline text-sm font-bold text-primary tracking-tight">
                            {isValid ? formatPrice(lineTotal) : "Revisar peso"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {cartItems.length > 0 && (
            <>
              {/* Delivery Fulfillment Selector */}
              <div className="space-y-2">
                <span
                  id={fulfillmentLabelId}
                  className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Modalidad de entrega
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby={fulfillmentLabelId}
                  onKeyDown={(e) => {
                    if (
                      ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)
                    ) {
                      e.preventDefault();
                      setFulfillment(fulfillment === "pickup" ? "delivery" : "pickup");
                    }
                  }}
                  className="grid grid-cols-2 gap-2 bg-brand-surface/60 p-1.5 rounded-xl border border-border"
                >
                  <button
                    type="button"
                    role="radio"
                    aria-checked={fulfillment === "pickup"}
                    tabIndex={fulfillment === "pickup" ? 0 : -1}
                    onClick={() => setFulfillment("pickup")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-center transition-all min-h-[44px]",
                      fulfillment === "pickup"
                        ? "bg-card text-primary font-bold shadow-sm border border-primary/50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Store className="size-4 text-primary" aria-hidden="true" />
                    <span className="text-xs font-semibold leading-tight">
                      Retiro en mostrador
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Sin costo
                    </span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={fulfillment === "delivery"}
                    tabIndex={fulfillment === "delivery" ? 0 : -1}
                    onClick={() => setFulfillment("delivery")}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-lg text-center transition-all min-h-[44px]",
                      fulfillment === "delivery"
                        ? "bg-card text-primary font-bold shadow-sm border border-primary/50"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Bike className="size-4 text-primary" aria-hidden="true" />
                    <span className="text-xs font-semibold leading-tight">
                      Envío a domicilio
                    </span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      A coordinar
                    </span>
                  </button>
                </div>
              </div>

              {/* Customer Inputs Form */}
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor={nameInputId}
                    className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    Tu Nombre
                  </label>
                  <div className="relative flex items-center">
                    <User className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                    <input
                      id={nameInputId}
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ingresá tu nombre y apellido"
                      className="min-h-[44px] w-full rounded-xl border border-border bg-card pl-9 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={notesInputId}
                    className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1"
                  >
                    {fulfillment === "delivery"
                      ? "Dirección de entrega y notas"
                      : "Notas para la sucursal (opcional)"}
                  </label>
                  <div className="relative flex items-start">
                    <FileText className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                    <textarea
                      id={notesInputId}
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        fulfillment === "delivery"
                          ? "Ej: Av. San Martín 1234, timbre 2B. Entregar después de las 17 hs..."
                          : "Ej: Paso a retirar a las 18:30 hs..."
                      }
                      className="w-full resize-none rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2 rounded-lg bg-brand-surface/60 p-2 border border-border/50 text-[11px] text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  <span>Stock fresco garantizado</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-brand-surface/60 p-2 border border-border/50 text-[11px] text-muted-foreground">
                  <Clock className="size-3.5 text-primary shrink-0" />
                  <span>
                    {fulfillment === "delivery"
                      ? "Envío directo desde local"
                      : "Listo para retirar rápido"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout Summary & CTA */}
        {cartItems.length > 0 && (
          <footer className="border-t border-border bg-card/95 p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] space-y-3">
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>
                  Subtotal ({itemCount} {itemCount === 1 ? "ítem" : "ítems"})
                </span>
                <span className="font-semibold text-foreground">
                  {hasInvalidItems ? "Pendiente de revisión" : formatPrice(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Modalidad</span>
                <span className="font-semibold text-primary">
                  {fulfillment === "pickup"
                    ? "Retiro en mostrador (Gratis)"
                    : "Envío a coordinar"}
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between border-t border-border/60 pt-2.5">
              <span className="font-headline text-xs font-bold uppercase tracking-wider text-foreground">
                Total Estimado
              </span>
              <span className="font-headline text-2xl font-black text-primary tracking-tight">
                {hasInvalidItems ? "Revisar pedido" : formatPrice(totalAmount)}
              </span>
            </div>

            <Button
              className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground hover:bg-brand-gold-hover font-headline font-bold text-sm tracking-wide shadow-lg shadow-brand-gold/15 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              onClick={handleSendWhatsApp}
              disabled={hasInvalidItems}
            >
              <Send className="size-4" />
              <span>Enviar Pedido por WhatsApp</span>
              <span className="text-xs font-normal opacity-90 hidden sm:inline">
                · Sucursal {branchName}
              </span>
            </Button>

            <p className="text-[11px] text-center text-muted-foreground">
              Se abrirá WhatsApp directo con{" "}
              <strong className="font-semibold text-foreground">
                Sucursal {branchName}
              </strong>{" "}
              para confirmar tu pedido.
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
