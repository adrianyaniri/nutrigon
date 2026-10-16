import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import { useAuth, Role } from "@/features/auth";
import { useBranches } from "@/features/catalog/hooks/use-catalog-queries";
import {
  branchPricingRepository,
  type BranchProductAdminItem,
} from "@/features/pricing/data/branch-pricing-repository";
import { combosRepository } from "../data/combos-repository";
import type { BranchComboAdminItem, CreateComboInput } from "../types";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

const FALLBACK_BRANCHES = [
  { id: "b-origone", slug: "origone", name: "Origone" },
  { id: "b-pedrodiaz", slug: "pedro-diaz", name: "Pedro Díaz" },
  { id: "b-wmorris", slug: "w-morris", name: "William Morris" },
] as const;

type ComboStatusFilter = "ALL" | "AVAILABLE" | "PAUSED";

interface SelectedProductItem {
  productId: string;
  productName: string;
  saleUnit: "WEIGHT" | "UNIT";
  unitPrice: number;
  quantity: number;
}

export function AdminCombosPage() {
  const { user, token, selectedBranchSlug } = useAuth();
  const queryClient = useQueryClient();

  const branchesQuery = useBranches();
  const branches =
    branchesQuery.data && branchesQuery.data.length > 0
      ? branchesQuery.data
      : FALLBACK_BRANCHES;

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;

  const activeBranch = useMemo(() => {
    if (!isGeneralAdmin && user?.branchId) {
      const byId = branches.find((b) => b.id === user.branchId);
      if (byId) return byId;
    }
    return branches.find((b) => b.slug === selectedBranchSlug) ?? branches[0]!;
  }, [branches, isGeneralAdmin, selectedBranchSlug, user?.branchId]);

  const branchId = activeBranch.id;
  const authToken = token ?? "mock-jwt-token";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComboStatusFilter>("ALL");
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmCombo, setDeleteConfirmCombo] = useState<BranchComboAdminItem | null>(null);

  // New Combo Form State
  const [comboName, setComboName] = useState("");
  const [comboDescription, setComboDescription] = useState("");
  const [comboPriceInput, setComboPriceInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedProductItem[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Product Search within Modal
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Combos Query
  const combosQuery = useQuery({
    queryKey: ["combos", "branch", branchId],
    queryFn: () => combosRepository.listForBranch(branchId, authToken),
  });

  // Available Products Query for Modal Picker
  const productsQuery = useQuery({
    queryKey: ["branch-products-picker", branchId, productSearchTerm],
    queryFn: () =>
      branchPricingRepository.listProducts(branchId, authToken, {
        search: productSearchTerm.trim() || undefined,
        limit: 50,
      }),
    enabled: isCreateModalOpen,
  });

  // Toggle Availability Mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({
      comboId,
      isAvailable,
    }: {
      comboId: string;
      isAvailable: boolean;
    }) => {
      return combosRepository.updateForBranch(branchId, comboId, authToken, {
        isAvailable,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<BranchComboAdminItem[]>(
        ["combos", "branch", branchId],
        (old) => (old ? old.map((c) => (c.id === updated.id ? updated : c)) : [updated])
      );
      setFeedbackBanner({
        type: "success",
        text: `El combo "${updated.name}" ahora está ${
          updated.isAvailable ? "disponible" : "pausado"
        }.`,
      });
    },
    onError: (err) => {
      setFeedbackBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Error al actualizar la disponibilidad.",
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (comboId: string) => {
      return combosRepository.deleteForBranch(branchId, comboId, authToken);
    },
    onSuccess: () => {
      if (deleteConfirmCombo) {
        queryClient.setQueryData<BranchComboAdminItem[]>(
          ["combos", "branch", branchId],
          (old) => (old ? old.filter((c) => c.id !== deleteConfirmCombo.id) : [])
        );
        setFeedbackBanner({
          type: "success",
          text: `El combo "${deleteConfirmCombo.name}" fue eliminado correctamente.`,
        });
        setDeleteConfirmCombo(null);
      }
    },
    onError: (err) => {
      setFeedbackBanner({
        type: "error",
        text: err instanceof Error ? err.message : "Error al eliminar el combo.",
      });
    },
  });

  // Create Combo Mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateComboInput) => {
      return combosRepository.createForBranch(branchId, authToken, input);
    },
    onSuccess: (newCombo) => {
      queryClient.setQueryData<BranchComboAdminItem[]>(
        ["combos", "branch", branchId],
        (old) => (old ? [newCombo, ...old] : [newCombo])
      );
      setIsCreateModalOpen(false);
      resetCreateForm();
      setFeedbackBanner({
        type: "success",
        text: `¡Combo "${newCombo.name}" creado y publicado exitosamente!`,
      });
    },
    onError: (err) => {
      setFormError(
        err instanceof Error ? err.message : "No se pudo crear el combo. Verificá los campos."
      );
    },
  });

  function resetCreateForm() {
    setComboName("");
    setComboDescription("");
    setComboPriceInput("");
    setSelectedItems([]);
    setUploadedImageUrl(null);
    setFormError(null);
    setProductSearchTerm("");
  }

  function handleOpenCreateModal() {
    resetCreateForm();
    setIsCreateModalOpen(true);
  }

  // Handle image upload to Cloudflare R2
  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Por favor seleccioná un archivo de imagen válido (JPEG, PNG o WEBP).");
      return;
    }

    try {
      setIsUploadingImage(true);
      setFormError(null);
      const publicUrl = await combosRepository.uploadComboImage(authToken, file);
      setUploadedImageUrl(publicUrl);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Error al subir la imagen a Cloudflare R2. Intentá nuevamente."
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleAddProduct(product: BranchProductAdminItem) {
    if (selectedItems.some((i) => i.productId === product.productId)) {
      return;
    }

    const defaultQty = product.saleUnit === "WEIGHT" ? 0.5 : 1;
    const unitPrice = product.promotionalPrice ?? product.price ?? 0;

    setSelectedItems((prev) => [
      ...prev,
      {
        productId: product.productId,
        productName: product.name,
        saleUnit: product.saleUnit,
        unitPrice,
        quantity: defaultQty,
      },
    ]);
  }

  function handleRemoveProduct(productId: string) {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function handleQuantityChange(productId: string, newQty: number) {
    if (newQty <= 0) return;
    setSelectedItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: newQty } : item))
    );
  }

  // Calculations for Reference sum & Discount
  const referenceTotalSum = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [selectedItems]);

  const parsedComboPrice = parseFloat(comboPriceInput.replace(",", ".")) || 0;

  const discountPercent = useMemo(() => {
    if (referenceTotalSum <= 0 || parsedComboPrice <= 0 || parsedComboPrice >= referenceTotalSum) {
      return null;
    }
    return Math.round(((referenceTotalSum - parsedComboPrice) / referenceTotalSum) * 100);
  }, [referenceTotalSum, parsedComboPrice]);

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (comboName.trim().length < 2) {
      setFormError("El nombre del combo debe tener al menos 2 caracteres.");
      return;
    }

    if (selectedItems.length < 2) {
      setFormError("Un combo debe incluir al menos 2 productos.");
      return;
    }

    if (parsedComboPrice <= 0) {
      setFormError("Ingresá un precio válido mayor a $0.");
      return;
    }

    createMutation.mutate({
      name: comboName.trim(),
      description: comboDescription.trim() || null,
      price: parsedComboPrice,
      imageUrls: uploadedImageUrl ? [uploadedImageUrl] : [],
      isAvailable: true,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  }

  // Filter combos list
  const filteredCombos = useMemo(() => {
    const list = combosQuery.data ?? [];
    return list.filter((combo) => {
      // Status filter
      if (statusFilter === "AVAILABLE" && !combo.isAvailable) return false;
      if (statusFilter === "PAUSED" && combo.isAvailable) return false;

      // Text search
      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      const matchName = combo.name.toLowerCase().includes(lower);
      const matchDesc = combo.description?.toLowerCase().includes(lower);
      const matchItem = combo.items.some((i) => i.productName.toLowerCase().includes(lower));
      return matchName || matchDesc || matchItem;
    });
  }, [combosQuery.data, statusFilter, searchTerm]);

  const totalCount = combosQuery.data?.length ?? 0;
  const availableCount = combosQuery.data?.filter((c) => c.isAvailable).length ?? 0;
  const pausedCount = totalCount - availableCount;

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center justify-between gap-3 p-4 rounded-xl border text-sm transition-all",
            feedbackBanner.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="size-5 shrink-0 text-red-400" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="p-1 rounded-md hover:bg-white/[0.08] text-white/60 hover:text-white"
            aria-label="Cerrar notificación"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-gold border border-brand-gold/20">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Sucursal {activeBranch.name}
            </span>
          </div>
          <h1 className="mt-2 font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Gestión de Combos y Packs
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Creá y administrá packs promocionales combinando productos por peso o unidad con precios
            especiales para la sucursal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleOpenCreateModal}
            className="min-h-[44px] w-full sm:w-auto bg-brand-gold text-surface hover:bg-brand-gold/90 font-semibold px-5 text-sm gap-2 shadow-sm"
          >
            <Plus className="size-4" />
            <span>Nuevo Combo</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-surface-card p-4">
          <span className="text-xs text-zinc-400 font-medium">Total de Combos</span>
          <p className="mt-1 font-headline text-2xl font-bold text-white">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-surface-card p-4">
          <span className="text-xs text-emerald-400 font-medium">Disponibles al Público</span>
          <p className="mt-1 font-headline text-2xl font-bold text-emerald-300">{availableCount}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-surface-card p-4">
          <span className="text-xs text-amber-400 font-medium">Pausados Temporalmente</span>
          <p className="mt-1 font-headline text-2xl font-bold text-amber-300">{pausedCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o producto..."
            className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] pl-9 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-gold"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111215] border border-white/[0.08] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px]",
              statusFilter === "ALL"
                ? "bg-brand-gold text-surface"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("AVAILABLE")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px]",
              statusFilter === "AVAILABLE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Disponibles ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PAUSED")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px]",
              statusFilter === "PAUSED"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Pausados ({pausedCount})
          </button>
        </div>
      </div>

      {/* Combos Grid / List */}
      {combosQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-400 space-y-3">
          <Loader2 className="size-8 animate-spin text-brand-gold" />
          <p className="text-sm">Cargando combos de la sucursal...</p>
        </div>
      ) : combosQuery.isError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-3">
          <AlertCircle className="size-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-200">
            {combosQuery.error instanceof Error
              ? combosQuery.error.message
              : "No se pudieron cargar los combos."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => combosQuery.refetch()}
            className="min-h-[44px] text-xs"
          >
            Reintentar
          </Button>
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-surface-card p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto">
            <Package className="size-6" />
          </div>
          <div>
            <h3 className="font-headline text-base font-semibold text-white">
              {searchTerm ? "No se encontraron combos con ese criterio" : "Aún no hay combos creados"}
            </h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
              {searchTerm
                ? "Probá ajustando los términos de búsqueda o cambiando el filtro."
                : "Armá promociones combinando al menos 2 productos para impulsar las ventas en esta sucursal."}
            </p>
          </div>
          {!searchTerm && (
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 text-xs font-semibold px-4"
            >
              <Plus className="size-4 mr-1" />
              Crear el primer combo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCombos.map((combo) => {
            const hasImage = combo.imageUrls && combo.imageUrls.length > 0;

            return (
              <article
                key={combo.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-surface-card p-4 transition-all hover:border-white/[0.2]",
                  combo.isAvailable
                    ? "border-white/[0.08]"
                    : "border-amber-500/30 bg-amber-500/[0.02]"
                )}
              >
                <div className="space-y-3">
                  {/* Image & Status Badge */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111215] border border-white/[0.06] flex items-center justify-center">
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
                      <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-[10px] text-brand-gold px-2 py-0.5 rounded-full font-mono border border-brand-gold/30">
                        Imagen por defecto
                      </span>
                    )}

                    <div className="absolute top-2 right-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border",
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
                  <div className="rounded-xl bg-[#111215] border border-white/[0.06] p-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
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
                            <span className="shrink-0 text-white font-mono text-[11px] bg-white/[0.05] px-1.5 py-0.5 rounded">
                              {qtyLabel}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Footer with Price & Actions */}
                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400">Precio combo</span>
                    <p className="font-headline text-lg font-bold text-brand-gold">
                      {formatPrice(combo.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        toggleAvailabilityMutation.mutate({
                          comboId: combo.id,
                          isAvailable: !combo.isAvailable,
                        })
                      }
                      disabled={toggleAvailabilityMutation.isPending}
                      className={cn(
                        "min-h-[40px] px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
                        combo.isAvailable
                          ? "border-white/[0.1] bg-[#111215] text-zinc-300 hover:text-amber-300 hover:border-amber-500/40"
                          : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      )}
                      title={combo.isAvailable ? "Pausar este combo" : "Habilitar para el público"}
                    >
                      {combo.isAvailable ? "Pausar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmCombo(combo)}
                      disabled={deleteMutation.isPending}
                      className="min-h-[40px] p-2.5 rounded-xl border border-white/[0.1] bg-[#111215] text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                      title="Eliminar combo"
                      aria-label={`Eliminar combo ${combo.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCombo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setDeleteConfirmCombo(null)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-red-500/30 bg-surface-card p-6 shadow-2xl space-y-4">
            <h3 id="delete-dialog-title" className="font-headline text-lg font-bold text-white">
              ¿Eliminar el combo "{deleteConfirmCombo.name}"?
            </h3>
            <p className="text-xs text-zinc-400">
              Esta acción dará de baja el combo en la sucursal {activeBranch.name}. Dejará de ser
              visible en el catálogo público inmediatamente.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteConfirmCombo(null)}
                className="min-h-[44px] text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => deleteMutation.mutate(deleteConfirmCombo.id)}
                disabled={deleteMutation.isPending}
                className="min-h-[44px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Confirmar eliminación"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Combo Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-combo-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsCreateModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/[0.1] bg-surface-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                  Sucursal {activeBranch.name}
                </span>
                <h2 id="create-combo-title" className="font-headline text-lg font-bold text-white">
                  Armar Nuevo Combo
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                aria-label="Cerrar modal de creación de combo"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Basic Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="combo-name-input" className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nombre del Combo *
                  </label>
                  <input
                    id="combo-name-input"
                    type="text"
                    required
                    value={comboName}
                    onChange={(e) => setComboName(e.target.value)}
                    placeholder="ej. Pack Desayuno Saludable"
                    className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label htmlFor="combo-desc-input" className="block text-xs font-semibold text-zinc-300 mb-1">
                    Descripción del Combo (opcional)
                  </label>
                  <textarea
                    id="combo-desc-input"
                    rows={2}
                    value={comboDescription}
                    onChange={(e) => setComboDescription(e.target.value)}
                    placeholder="ej. Combinación de frutos secos y avena para arrancar la semana con energía."
                    className="w-full rounded-xl border border-white/[0.1] bg-[#111215] p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-gold resize-none"
                  />
                </div>

                {/* Image Upload directly to Cloudflare R2 */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
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
                          onClick={() => setUploadedImageUrl(null)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                          title="Eliminar foto"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative size-16 rounded-xl overflow-hidden border border-white/[0.1] bg-[#111215] shrink-0">
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
                      <label className="inline-flex min-h-[44px] items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.1] bg-[#111215] text-xs font-semibold text-zinc-300 hover:text-white hover:border-brand-gold cursor-pointer transition-colors">
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
                          accept="image/*"
                          disabled={isUploadingImage}
                          onChange={handleImageFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {uploadedImageUrl
                          ? "Foto personalizada alojada en Cloudflare R2."
                          : "Usa la imagen oficial de Nutrigon por defecto. Podés subir una foto personalizada a R2."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Picker Section */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Productos Incluidos ({selectedItems.length}/2 mínimos)
                    </h3>
                    <p className="text-[11px] text-zinc-400">
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#111215] p-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white truncate block">
                              {item.productName}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Precio ref: {formatPrice(item.unitPrice)}{" "}
                              {item.saleUnit === "WEIGHT" ? "/ kg" : "/ un."}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5">
                              <label htmlFor={`qty-${item.productId}`} className="text-[11px] text-zinc-400">
                                Cantidad:
                              </label>
                              <input
                                id={`qty-${item.productId}`}
                                type="number"
                                min={item.saleUnit === "WEIGHT" ? 0.05 : 1}
                                step={item.saleUnit === "WEIGHT" ? 0.05 : 1}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.productId,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 min-h-[36px] rounded-lg border border-white/[0.1] bg-surface px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-brand-gold"
                              />
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {item.saleUnit === "WEIGHT" ? "kg" : "un."}
                              </span>
                            </div>

                            {/* Subtotal */}
                            <div className="w-24 text-right">
                              <span className="text-[10px] text-zinc-500 block uppercase">Subtotal</span>
                              <span className="font-mono font-semibold text-brand-gold">
                                {formatPrice(itemSubtotal)}
                              </span>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.productId)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/[0.04]"
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
                <div className="rounded-xl border border-white/[0.06] bg-[#111215] p-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                    <input
                      type="text"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      placeholder="Buscar producto de la sucursal para agregar..."
                      className="w-full min-h-[38px] rounded-lg border border-white/[0.1] bg-surface pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  {/* Search Results list */}
                  <div className="max-h-36 overflow-y-auto divide-y divide-white/[0.04]">
                    {productsQuery.isLoading ? (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        Buscando productos...
                      </div>
                    ) : productsQuery.data?.items && productsQuery.data.items.length > 0 ? (
                      productsQuery.data.items.map((prod) => {
                        const isAlreadySelected = selectedItems.some(
                          (i) => i.productId === prod.productId
                        );
                        return (
                          <div
                            key={prod.productId}
                            className="flex items-center justify-between py-1.5 px-1 text-xs"
                          >
                            <span className="truncate pr-2 text-zinc-300">{prod.name}</span>
                            <button
                              type="button"
                              disabled={isAlreadySelected}
                              onClick={() => handleAddProduct(prod)}
                              className={cn(
                                "shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors",
                                isAlreadySelected
                                  ? "bg-white/[0.05] text-zinc-500 cursor-not-allowed"
                                  : "bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25"
                              )}
                            >
                              {isAlreadySelected ? "Agregado" : "+ Agregar"}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-xs text-zinc-500">
                        No se encontraron productos disponibles.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Discount Section */}
              <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                <div className="rounded-xl border border-white/[0.08] bg-[#111215] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Suma individual de referencia:</span>
                    <strong className="text-white font-mono text-sm">
                      {formatPrice(referenceTotalSum)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="combo-final-price" className="text-xs font-semibold text-white">
                      Precio Final del Combo ($) *
                    </label>
                    <input
                      id="combo-final-price"
                      type="number"
                      required
                      min={1}
                      step={1}
                      value={comboPriceInput}
                      onChange={(e) => setComboPriceInput(e.target.value)}
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
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="min-h-[44px] text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    selectedItems.length < 2 ||
                    comboName.trim().length < 2 ||
                    parsedComboPrice <= 0 ||
                    isUploadingImage
                  }
                  className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 font-semibold text-xs px-5 shadow-sm disabled:opacity-50"
                >
                  {createMutation.isPending ? (
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
      )}
    </div>
  );
}
