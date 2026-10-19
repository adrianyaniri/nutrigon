import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogFocusTrap } from "@/hooks";
import { slugifyCategoryName } from "../lib/slugify";
import type { MasterCategory } from "../types";

export interface MasterCategoryModalProps {
  isOpen: boolean;
  categories: MasterCategory[];
  editingCategoryId: string;
  onSelectCategoryMode: (categoryId: string) => void;
  categoryName: string;
  onCategoryNameChange: (name: string) => void;
  categorySlug: string;
  onCategorySlugChange: (slug: string) => void;
  formError: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MasterCategoryModal({
  isOpen,
  categories,
  editingCategoryId,
  onSelectCategoryMode,
  categoryName,
  onCategoryNameChange,
  categorySlug,
  onCategorySlugChange,
  formError,
  isSaving,
  onClose,
  onSubmit,
}: MasterCategoryModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-outline bg-surface-card p-6 shadow-2xl space-y-4 overscroll-contain"
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center -mt-2 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
        </div>
        <div className="flex items-center justify-between">
          <h2
            id="category-modal-title"
            className="font-headline text-lg font-bold text-white"
          >
            {editingCategoryId ? "Editar Categoría Maestra" : "Nueva Categoría Maestra"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full text-zinc-400 hover:bg-surface-hover hover:text-white"
            aria-label="Cerrar modal de categoría"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="category-mode-select"
              className="block text-xs font-semibold text-zinc-300 mb-1"
            >
              Acción sobre Categorías
            </label>
            <select
              id="category-mode-select"
              value={editingCategoryId}
              onChange={(e) => onSelectCategoryMode(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3 text-xs text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            >
              <option value="">+ Crear nueva categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  Editar: {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category-name-input"
              className="block text-xs font-semibold text-zinc-300 mb-1"
            >
              Nombre de la Categoría *
            </label>
            <input
              id="category-name-input"
              type="text"
              required
              value={categoryName}
              onChange={(e) => {
                onCategoryNameChange(e.target.value);
                onCategorySlugChange(slugifyCategoryName(e.target.value));
              }}
              placeholder="ej. Legumbres y Semillas"
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div>
            <label
              htmlFor="category-slug-input"
              className="block text-xs font-semibold text-zinc-300 mb-1"
            >
              Identificador URL (Slug) *
            </label>
            <input
              id="category-slug-input"
              type="text"
              required
              value={categorySlug}
              onChange={(e) => onCategorySlugChange(e.target.value)}
              placeholder="ej. legumbres-y-semillas"
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs font-mono text-zinc-300 placeholder:text-zinc-500 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              disabled={isSaving || categoryName.trim().length < 2}
              className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 font-semibold text-xs px-5"
            >
              {isSaving ? "Guardando..." : "Guardar Categoría"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
