import { AlertCircle, Loader2, Upload, X } from "lucide-react";
import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import { Button } from "@/components/ui/button";
import type { SaleUnit } from "@/features/catalog/types";
import { useDialogFocusTrap } from "@/hooks";
import type { MasterCategory, MasterProduct } from "../types";

export interface MasterProductFormModalProps {
  isOpen: boolean;
  editingProduct: MasterProduct | null;
  categories: MasterCategory[];
  productName: string;
  onProductNameChange: (value: string) => void;
  productCategoryId: string;
  onProductCategoryIdChange: (value: string) => void;
  productSaleUnit: SaleUnit;
  onProductSaleUnitChange: (value: SaleUnit) => void;
  productCode: string;
  onProductCodeChange: (value: string) => void;
  productBarcode: string;
  onProductBarcodeChange: (value: string) => void;
  productDescription: string;
  onProductDescriptionChange: (value: string) => void;
  productImageUrl: string | null;
  onClearProductImage: () => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingImage: boolean;
  isSaving: boolean;
  formError: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MasterProductFormModal({
  isOpen,
  editingProduct,
  categories,
  productName,
  onProductNameChange,
  productCategoryId,
  onProductCategoryIdChange,
  productSaleUnit,
  onProductSaleUnitChange,
  productCode,
  onProductCodeChange,
  productBarcode,
  onProductBarcodeChange,
  productDescription,
  onProductDescriptionChange,
  productImageUrl,
  onClearProductImage,
  onImageFileChange,
  isUploadingImage,
  isSaving,
  formError,
  onClose,
  onSubmit,
}: MasterProductFormModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="master-product-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-xl max-h-[92dvh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-outline bg-surface-card shadow-2xl overflow-hidden overscroll-contain"
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center pt-2.5 pb-0">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
        </div>
        <div className="flex items-center justify-between border-b border-outline px-6 py-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
              Catálogo Maestro
            </span>
            <h2
              id="master-product-modal-title"
              className="font-headline text-lg font-bold text-white"
            >
              {editingProduct ? `Editar: ${editingProduct.name}` : "Nuevo Producto Maestro"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full text-zinc-400 hover:bg-surface-hover hover:text-white"
            aria-label="Cerrar modal de producto maestro"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="master-product-name"
              className="block text-xs font-semibold text-zinc-300 mb-1"
            >
              Nombre del Producto *
            </label>
            <input
              id="master-product-name"
              type="text"
              required
              value={productName}
              onChange={(e) => onProductNameChange(e.target.value)}
              placeholder="ej. Almendras Nonpareil Tostadas"
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="master-product-category"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                Categoría *
              </label>
              <select
                id="master-product-category"
                required
                value={productCategoryId}
                onChange={(e) => onProductCategoryIdChange(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3 text-xs text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="master-product-unit"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                Modalidad de Venta *
              </label>
              <select
                id="master-product-unit"
                value={productSaleUnit}
                onChange={(e) => onProductSaleUnitChange(e.target.value as SaleUnit)}
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3 text-xs text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              >
                <option value="WEIGHT">Granel (Precio por 1 kg)</option>
                <option value="UNIT">Por Unidad cerrada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="master-product-code"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                Código Interno / SKU (opcional)
              </label>
              <input
                id="master-product-code"
                type="text"
                value={productCode}
                onChange={(e) => onProductCodeChange(e.target.value)}
                placeholder="ej. FS-015"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs font-mono text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <label
                htmlFor="master-product-barcode"
                className="block text-xs font-semibold text-zinc-300 mb-1"
              >
                Código de Barras EAN (opcional)
              </label>
              <input
                id="master-product-barcode"
                type="text"
                value={productBarcode}
                onChange={(e) => onProductBarcodeChange(e.target.value)}
                placeholder="ej. 7791234567890"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs font-mono text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="master-product-description"
              className="block text-xs font-semibold text-zinc-300 mb-1"
            >
              Descripción comercial (opcional)
            </label>
            <textarea
              id="master-product-description"
              rows={2}
              value={productDescription}
              onChange={(e) => onProductDescriptionChange(e.target.value)}
              placeholder="ej. Producto natural seleccionado, ideal para repostería o snack saludable."
              className="w-full rounded-xl border border-outline bg-surface p-3 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold resize-none"
            />
          </div>

          {/* Direct R2 Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Foto Maestra del Producto (Cloudflare R2)
            </label>
            <div className="flex items-center gap-4">
              {productImageUrl ? (
                <div className="relative size-16 rounded-xl overflow-hidden border border-brand-gold/40 shrink-0">
                  <img
                    src={productImageUrl}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={onClearProductImage}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                    title="Quitar imagen"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="relative size-16 rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-center text-zinc-500 shrink-0 overflow-hidden">
                  {isUploadingImage ? (
                    <Loader2 className="size-5 animate-spin text-brand-gold" />
                  ) : (
                    <img
                      src={DEFAULT_PRODUCT_IMAGE}
                      alt="Imagen por defecto"
                      className="w-full h-full object-cover opacity-60"
                    />
                  )}
                </div>
              )}

              <div className="flex-1">
                <label className="inline-flex min-h-[44px] items-center gap-2 px-3.5 py-2 rounded-xl border border-outline bg-surface text-xs font-semibold text-zinc-300 hover:text-white hover:border-brand-gold cursor-pointer transition-colors">
                  <Upload className="size-4 text-brand-gold" />
                  <span>
                    {isUploadingImage
                      ? "Subiendo a R2..."
                      : productImageUrl
                      ? "Cambiar foto"
                      : "Subir foto del producto"}
                  </span>
                  <input
                    type="file"
                    accept="image/webp,image/jpeg,image/png"
                    disabled={isUploadingImage}
                    onChange={onImageFileChange}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1 text-[11px] text-zinc-500">
                  WEBP, JPEG o PNG (máx. 5 MB). Se optimiza automáticamente a WebP y se sincroniza en las 3 sucursales.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[44px] text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploadingImage || productName.trim().length < 2}
              className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 font-semibold text-xs px-5"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : editingProduct ? (
                "Guardar Cambios"
              ) : (
                "Crear Producto Maestro"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
