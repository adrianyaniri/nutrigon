import { useState, useEffect } from "react";
import { FolderCog, List, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogFocusTrap } from "@/hooks";
import { slugifyCategoryName } from "../lib/slugify";
import type { MasterCategory, MasterProduct } from "../types";
import { cn } from "@/lib/utils/cn";

export interface MasterCategoryModalProps {
  isOpen: boolean;
  categories: MasterCategory[];
  products?: MasterProduct[];
  editingCategoryId: string;
  onSelectCategoryMode: (categoryId: string) => void;
  categoryName: string;
  onCategoryNameChange: (name: string) => void;
  categorySlug: string;
  onCategorySlugChange: (slug: string) => void;
  formError: string | null;
  isSaving: boolean;
  isDeleting?: boolean;
  onDeleteCategory?: (categoryId: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MasterCategoryModal({
  isOpen,
  categories,
  products = [],
  editingCategoryId,
  onSelectCategoryMode,
  categoryName,
  onCategoryNameChange,
  categorySlug,
  onCategorySlugChange,
  formError,
  isSaving,
  isDeleting = false,
  onDeleteCategory,
  onClose,
  onSubmit,
}: MasterCategoryModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  const [activeTab, setActiveTab] = useState<"form" | "list">("form");

  // Keep tab in sync with editingCategoryId selection
  useEffect(() => {
    if (editingCategoryId) {
      setActiveTab("form");
    }
  }, [editingCategoryId]);

  if (!isOpen) return null;

  // Calculate product counts per category
  const productCountMap = products.reduce<Record<string, number>>((acc, prod) => {
    acc[prod.categoryId] = (acc[prod.categoryId] || 0) + 1;
    return acc;
  }, {});

  const currentCategory = categories.find((c) => c.id === editingCategoryId);

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
        className="relative z-10 w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-outline bg-surface-card p-5 sm:p-6 shadow-2xl space-y-4 overscroll-contain"
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center -mt-2 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-outline/70 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
              <FolderCog className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="category-modal-title"
                className="font-headline text-base sm:text-lg font-bold text-white"
              >
                {activeTab === "list"
                  ? "Gestión de Categorías Maestras"
                  : editingCategoryId
                  ? "Editar Categoría Maestra"
                  : "Nueva Categoría Maestra"}
              </h2>
              <p className="text-xs text-zinc-400">
                {activeTab === "list"
                  ? `${categories.length} categorías configuradas en el catálogo global`
                  : editingCategoryId
                  ? `Modificando "${currentCategory?.name ?? categoryName}"`
                  : "Crea una nueva categoría para organizar productos en todas las sucursales"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:bg-surface-hover hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal de categoría"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Tabs (Listado vs Formulario) */}
        <div
          role="tablist"
          aria-label="Vistas de gestión de categorías"
          className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-outline/80"
        >
          <button
            type="button"
            role="tab"
            id="category-tab-list"
            aria-controls="category-tabpanel-list"
            aria-selected={activeTab === "list"}
            onClick={() => {
              onSelectCategoryMode("");
              setActiveTab("list");
            }}
            className={cn(
              "flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "list"
                ? "bg-brand-gold text-brand-dark shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-surface-hover"
            )}
          >
            <List className="size-3.5" aria-hidden="true" />
            <span>Lista de Categorías ({categories.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            id="category-tab-form"
            aria-controls="category-tabpanel-form"
            aria-selected={activeTab === "form"}
            onClick={() => setActiveTab("form")}
            className={cn(
              "flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === "form"
                ? "bg-brand-gold text-brand-dark shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-surface-hover"
            )}
          >
            {editingCategoryId ? (
              <>
                <Pencil className="size-3.5" aria-hidden="true" />
                <span>Editar Categoría</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Nueva Categoría</span>
              </>
            )}
          </button>
        </div>

        {/* TAB 1: LIST VIEW */}
        {activeTab === "list" && (
          <div
            role="tabpanel"
            id="category-tabpanel-list"
            aria-labelledby="category-tab-list"
            className="space-y-2.5 pt-1"
          >
            <div className="space-y-2 max-h-[50dvh] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const count = productCountMap[cat.id] ?? 0;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-outline bg-surface hover:border-brand-gold/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-headline text-sm font-bold text-white truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          Activa
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="font-mono text-zinc-500">/{cat.slug}</span>
                        <span>·</span>
                        <span className="text-brand-muted tabular-nums">
                          {count === 1 ? "1 producto maestro" : `${count} productos maestros`}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      aria-label={`Editar categoría ${cat.name}`}
                      onClick={() => {
                        onSelectCategoryMode(cat.id);
                        setActiveTab("form");
                      }}
                      className="min-h-[44px] px-3.5 border-outline hover:border-brand-gold/60 hover:bg-brand-gold/10 hover:text-brand-gold text-xs font-semibold gap-1.5 shrink-0"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span>Editar</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FORM VIEW (CREATE OR EDIT) */}
        {activeTab === "form" && (
          <form
            role="tabpanel"
            id="category-tabpanel-form"
            aria-labelledby="category-tab-form"
            onSubmit={onSubmit}
            className="space-y-4 pt-1"
          >
            {formError && (
              <div className="p-3 rounded-xl border border-status-destructive/30 bg-status-destructive/10 text-status-destructive text-xs font-medium">
                {formError}
              </div>
            )}

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
                  // Auto-generate slug when creating or if slug matches old auto-generated slug
                  if (!editingCategoryId || categorySlug === slugifyCategoryName(categoryName)) {
                    onCategorySlugChange(slugifyCategoryName(e.target.value));
                  }
                }}
                placeholder="ej. Legumbres y Semillas"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-500 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="category-slug-input"
                  className="block text-xs font-semibold text-zinc-300"
                >
                  Identificador URL (Slug) *
                </label>
                <button
                  type="button"
                  onClick={() => onCategorySlugChange(slugifyCategoryName(categoryName))}
                  className="min-h-[44px] inline-flex items-center px-1 text-[11px] text-muted-foreground hover:text-brand-gold hover:underline cursor-pointer"
                >
                  Regenerar desde nombre
                </button>
              </div>
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

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline/70">
              {editingCategoryId && onDeleteCategory ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || isDeleting}
                  onClick={() => onDeleteCategory(editingCategoryId)}
                  className="min-h-[44px] border-status-destructive/40 bg-status-destructive/10 text-status-destructive hover:bg-status-destructive hover:text-white text-xs font-semibold gap-1.5"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>{isDeleting ? "Eliminando..." : "Eliminar Categoría"}</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
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
                  disabled={isSaving || isDeleting || categoryName.trim().length < 2}
                  className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold/90 font-semibold text-xs px-5 shadow-sm"
                >
                  {isSaving ? "Guardando..." : "Guardar Categoría"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
