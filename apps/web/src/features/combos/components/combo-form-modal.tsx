import { AlertCircle, Loader2, Percent, Search, Upload, X } from "lucide-react";
import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import { Button } from "@/components/ui/button";
import type { BranchProductAdminItem } from "@/features/pricing/data/branch-pricing-repository";
import { useDialogFocusTrap } from "@/hooks";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

export interface SelectedComboProductItem {
  productId: string;
  productName: string;
  saleUnit: "WEIGHT" | "UNIT";
  unitPrice: number;
  quantity: number;
}

export interface ComboFormModalProps {
  isOpen: boolean;
  branchName: string;
  comboName: string;
  onComboNameChange: (value: string) => void;
  comboDescription: string;
  onComboDescriptionChange: (value: string) => void;
  comboPriceInput: string;
  onComboPriceInputChange: (value: string) => void;
  selectedItems: SelectedComboProductItem[];
  onAddProduct: (product: BranchProductAdminItem) => void;
  onRemoveProduct: (productId: string) => void;
  onQuantityChange: (productId: string, newQty: number) => void;
  productSearchTerm: string;
  onProductSearchTermChange: (value: string) => void;
  availableProducts: BranchProductAdminItem[];
  isLoadingProducts: boolean;
  uploadedImageUrl: string | null;
  onClearUploadedImage: () => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage: boolean;
  referenceTotalSum: number;
  parsedComboPrice: number;
  discountPercent: number | null;
  formError: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ComboFormModal({
  isOpen,
  branchName,
  comboName,
  onComboNameChange,
  comboDescription,
  onComboDescriptionChange,
  comboPriceInput,
  onComboPriceInputChange,
  selectedItems,
  onAddProduct,
  onRemoveProduct,
  onQuantityChange,
  productSearchTerm,
  onProductSearchTermChange,
  availableProducts,
  isLoadingProducts,
  uploadedImageUrl,
  onClearUploadedImage,
  onImageFileChange,
  isUploadingImage,
  referenceTotalSum,
  parsedComboPrice,
  discountPercent,
  formError,
  isSaving,
  onClose,
  onSubmit,
}: ComboFormModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-combo-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-2xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-outline bg-surface-card shadow-2xl overflow-hidden overscroll-contain"
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center pt-2.5 pb-0">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
        </div>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline px-6 py-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
              Sucursal {branchName}
            </span>
            <h2 id="create-combo-title" className="font-headline text-lg font-bold text-foreground">
              Armar Nuevo Combo
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full text-muted-foreground hover:bg-surface-hover hover:text-foreground cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none"
            aria-label="Cerrar modal de creación de combo"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="combo-name-input" className="block text-xs font-semibold text-foreground/90 mb-1">
                Nombre del Combo *
              </label>
              <input
                id="combo-name-input"
                type="text"
                required
                value={comboName}
                onChange={(e) => onComboNameChange(e.target.value)}
                placeholder="ej. Pack Desayuno Saludable"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label htmlFor="combo-desc-input" className="block text-xs font-semibold text-foreground/90 mb-1">
                Descripción del Combo (opcional)
              </label>
              <textarea
                id="combo-desc-input"
                rows={2}
                value={comboDescription}
                onChange={(e) => onComboDescriptionChange(e.target.value)}
                placeholder="ej. Combinación de frutos secos y avena para arrancar la semana con energía."
                className="w-full rounded-xl border border-outline bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>

            {/* Image Upload directly to Cloudflare R2 */}
            <div>
              <label className="block text-xs font-semibold text-foreground/90 mb-1">
                Foto del Combo (Cloudflare R2)
              </label>
              <div className="flex items-center gap-4">
                {uploadedImageUrl ? (
                  <div className="relative size-16 rounded-xl overflow-hidden border border-brand-gold/40 shrink-0">
                    <img
                      src={uploadedImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={onClearUploadedImage}
                      aria-label="Eliminar foto del combo"
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none transition-opacity cursor-pointer"
                      title="Eliminar foto"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative size-16 rounded-xl overflow-hidden border border-outline bg-surface shrink-0">
                    {isUploadingImage ? (
                      <div className="size-full flex items-center justify-center">
                        <Loader2 className="size-5 animate-spin text-brand-gold" />
                      </div>
                    ) : (
                      <img
                        src={DEFAULT_PRODUCT_IMAGE}
                        alt="Imagen Nutrigon por defecto"
                        className="size-full object-cover opacity-85"
                        onError={(e) => {
                          e.currentTarget.src = "/Logo.jpeg";
                        }}
                      />
                    )}
                  </div>
                )}

                <div className="flex-1">
                  <label className="inline-flex min-h-[44px] items-center gap-2 px-3.5 py-2 rounded-xl border border-outline bg-surface text-xs font-semibold text-foreground/90 hover:text-foreground hover:border-brand-gold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-gold has-[:focus-visible]:border-brand-gold cursor-pointer transition-all">
                    <Upload className="size-4 text-brand-gold" />
                    <span>
                      {isUploadingImage
                        ? "Subiendo a R2..."
                        : uploadedImageUrl
                        ? "Cambiar imagen personalizada"
                        : "Subir imagen personalizada"}
                    </span>
                    <input
                      type="file"
                      accept="image/webp,image/jpeg,image/png"
                      disabled={isUploadingImage}
                      onChange={onImageFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {uploadedImageUrl
                      ? "Foto personalizada alojada en Cloudflare R2."
                      : "WEBP, JPEG o PNG (máx. 5 MB, optimizado automáticamente a WebP en R2)."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Picker Section */}
          <div className="space-y-3 pt-3 border-t border-outline">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Productos Incluidos ({selectedItems.length}/2 mínimos)
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Seleccioná los productos que integran este combo y definí sus cantidades.
                </p>
              </div>
            </div>

            {/* Selected Items List */}
            {selectedItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-4 text-center">
                <p className="text-xs text-amber-300 font-medium">
                  Todavía no agregaste productos. Buscá abajo y sumá al menos 2.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => {
                  const itemSubtotal = item.unitPrice * item.quantity;

                  return (
                    <div
                      key={item.productId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-outline bg-surface p-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-foreground truncate block">
                          {item.productName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Precio ref: {formatPrice(item.unitPrice)}{" "}
                          {item.saleUnit === "WEIGHT" ? "/ kg" : "/ un."}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5">
                          <label htmlFor={`qty-${item.productId}`} className="text-[11px] text-muted-foreground">
                            Cantidad:
                          </label>
                          <input
                            id={`qty-${item.productId}`}
                            type="number"
                            min={item.saleUnit === "WEIGHT" ? 0.05 : 1}
                            step={item.saleUnit === "WEIGHT" ? 0.05 : 1}
                            value={item.quantity}
                            onChange={(e) =>
                              onQuantityChange(
                                item.productId,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 min-h-[44px] rounded-lg border border-outline bg-surface px-2 py-1 text-center font-mono text-xs text-foreground focus:outline-none focus:border-brand-gold"
                          />
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {item.saleUnit === "WEIGHT" ? "kg" : "un."}
                          </span>
                        </div>

                        {/* Subtotal */}
                        <div className="w-24 text-right">
                          <span className="text-[11px] text-muted-foreground block uppercase">Subtotal</span>
                          <span className="font-mono font-semibold text-brand-gold">
                            {formatPrice(itemSubtotal)}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => onRemoveProduct(item.productId)}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none cursor-pointer"
                          aria-label={`Quitar ${item.productName} del combo`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Product Search & Quick Add */}
            <div className="rounded-xl border border-outline/60 bg-surface p-3 space-y-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={productSearchTerm}
                  onChange={(e) => onProductSearchTermChange(e.target.value)}
                  placeholder="Buscar producto de la sucursal para agregar..."
                  aria-label="Buscar producto de la sucursal para agregar"
                  className="w-full min-h-[44px] rounded-lg border border-outline bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Search Results list */}
              <div className="max-h-48 overflow-y-auto divide-y divide-outline/40">
                {isLoadingProducts ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Buscando productos...
                  </div>
                ) : availableProducts.length > 0 ? (
                  availableProducts.map((prod) => {
                    const isAlreadySelected = selectedItems.some(
                      (i) => i.productId === prod.productId
                    );
                    return (
                      <div
                        key={prod.productId}
                        className="flex items-center justify-between py-2 px-1 text-xs gap-2"
                      >
                        <span className="truncate pr-2 text-foreground/90 font-medium">{prod.name}</span>
                        <button
                          type="button"
                          disabled={isAlreadySelected}
                          onClick={() => onAddProduct(prod)}
                          aria-label={
                            isAlreadySelected
                              ? `${prod.name} ya agregado al combo`
                              : `Agregar ${prod.name} al combo`
                          }
                          className={cn(
                            "shrink-0 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none flex items-center justify-center",
                            isAlreadySelected
                              ? "bg-surface-elevated text-muted-foreground/60 cursor-not-allowed"
                              : "bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25 cursor-pointer"
                          )}
                        >
                          {isAlreadySelected ? "Agregado" : "+ Agregar"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No se encontraron productos disponibles.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price & Discount Section */}
          <div className="space-y-3 pt-3 border-t border-outline">
            <div className="rounded-xl border border-outline bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Suma individual de referencia:</span>
                <strong className="text-foreground font-mono text-sm">
                  {formatPrice(referenceTotalSum)}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label htmlFor="combo-final-price" className="text-xs font-semibold text-foreground">
                  Precio Final del Combo ($) *
                </label>
                <input
                  id="combo-final-price"
                  type="number"
                  required
                  min={1}
                  step={1}
                  value={comboPriceInput}
                  onChange={(e) => onComboPriceInputChange(e.target.value)}
                  placeholder="ej. 11500"
                  className="w-36 min-h-[44px] rounded-xl border border-brand-gold/40 bg-surface px-3 text-right font-mono text-sm font-bold text-brand-gold focus:outline-none focus:border-brand-gold"
                />
              </div>

              {discountPercent !== null && discountPercent > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Percent className="size-3.5" />
                    <span>Ahorro del {discountPercent}% para el cliente</span>
                  </div>
                  <span className="font-mono font-bold">
                    -{formatPrice(referenceTotalSum - parsedComboPrice)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] text-xs cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                selectedItems.length < 2 ||
                comboName.trim().length < 2 ||
                parsedComboPrice <= 0 ||
                isUploadingImage
              }
              className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold-hover font-semibold text-xs px-5 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creando...</span>
                </div>
              ) : (
                "Guardar Combo"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
