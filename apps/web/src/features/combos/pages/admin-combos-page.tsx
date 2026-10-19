import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
  Package,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, Role } from "@/features/auth";
import { useBranches } from "@/features/catalog/hooks/use-catalog-queries";
import {
  branchPricingRepository,
  type BranchProductAdminItem,
} from "@/features/pricing/data/branch-pricing-repository";
import { useDebounce, useDialogFocusTrap } from "@/hooks";
import { cn } from "@/lib/utils/cn";
import { ComboCard } from "../components/combo-card";
import {
  ComboFormModal,
  type SelectedComboProductItem,
} from "../components/combo-form-modal";
import { combosRepository } from "../data/combos-repository";
import type { BranchComboAdminItem, CreateComboInput } from "../types";

type ComboStatusFilter = "ALL" | "AVAILABLE" | "PAUSED";

export function AdminCombosPage() {
  const { user, token, selectedBranchSlug } = useAuth();
  const queryClient = useQueryClient();

  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;

  const activeBranch = useMemo(() => {
    if (!isGeneralAdmin && user?.branchId) {
      const byId = branches.find((b) => b.id === user.branchId);
      if (byId) return byId;
    }
    return branches.find((b) => b.slug === selectedBranchSlug) ?? branches[0];
  }, [branches, isGeneralAdmin, selectedBranchSlug, user?.branchId]);

  const branchId = activeBranch?.id ?? "";
  const authToken = token ?? "mock-jwt-token";

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComboStatusFilter>("ALL");
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function showFeedback(type: "success" | "error", text: string) {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmCombo, setDeleteConfirmCombo] =
    useState<BranchComboAdminItem | null>(null);

  const deleteModalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen: Boolean(deleteConfirmCombo),
    onClose: () => setDeleteConfirmCombo(null),
  });

  // New Combo Form State
  const [comboName, setComboName] = useState("");
  const [comboDescription, setComboDescription] = useState("");
  const [comboPriceInput, setComboPriceInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedComboProductItem[]>(
    []
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Product Search within Modal
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 300);

  // Combos Query
  const combosQuery = useQuery({
    queryKey: ["combos", "branch", branchId],
    queryFn: () => combosRepository.listForBranch(branchId, authToken),
    enabled: Boolean(branchId),
  });

  // Available Products Query for Modal Picker
  const productsQuery = useQuery({
    queryKey: ["branch-products-picker", branchId, debouncedProductSearchTerm],
    queryFn: () =>
      branchPricingRepository.listProducts(branchId, authToken, {
        search: debouncedProductSearchTerm.trim() || undefined,
        limit: 50,
      }),
    enabled: isCreateModalOpen && Boolean(branchId),
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
      if (isGeneralAdmin) {
        throw new Error(
          "Los administradores generales no pueden modificar la disponibilidad de los combos."
        );
      }
      return combosRepository.updateForBranch(branchId, comboId, authToken, {
        isAvailable,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<BranchComboAdminItem[]>(
        ["combos", "branch", branchId],
        (old) =>
          old ? old.map((c) => (c.id === updated.id ? updated : c)) : [updated]
      );
      showFeedback(
        "success",
        `El combo "${updated.name}" ahora está ${
          updated.isAvailable ? "disponible" : "pausado"
        }.`
      );
    },
    onError: (err) => {
      showFeedback(
        "error",
        err instanceof Error
          ? err.message
          : "Error al actualizar la disponibilidad."
      );
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (comboId: string) => {
      if (isGeneralAdmin) {
        throw new Error(
          "Los administradores generales no pueden eliminar combos."
        );
      }
      return combosRepository.deleteForBranch(branchId, comboId, authToken);
    },
    onSuccess: () => {
      if (!deleteConfirmCombo) return;

      queryClient.setQueryData<BranchComboAdminItem[]>(
        ["combos", "branch", branchId],
        (old) => (old ? old.filter((c) => c.id !== deleteConfirmCombo.id) : [])
      );
      showFeedback(
        "success",
        `El combo "${deleteConfirmCombo.name}" fue eliminado correctamente.`
      );
      setDeleteConfirmCombo(null);
    },
    onError: (err) => {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "Error al eliminar el combo."
      );
    },
  });

  // Create Combo Mutation
  const createMutation = useMutation({
    mutationFn: async (input: CreateComboInput) => {
      if (isGeneralAdmin) {
        throw new Error(
          "Los administradores generales no pueden crear combos ni packs."
        );
      }
      return combosRepository.createForBranch(branchId, authToken, input);
    },
    onSuccess: (newCombo) => {
      queryClient.setQueryData<BranchComboAdminItem[]>(
        ["combos", "branch", branchId],
        (old) => (old ? [newCombo, ...old] : [newCombo])
      );
      setIsCreateModalOpen(false);
      resetCreateForm();
      showFeedback(
        "success",
        `¡Combo "${newCombo.name}" creado y publicado exitosamente!`
      );
    },
    onError: (err) => {
      setFormError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el combo. Verificá los campos."
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
    if (isGeneralAdmin) {
      showFeedback(
        "error",
        "Los administradores generales no pueden crear combos ni packs."
      );
      return;
    }
    resetCreateForm();
    setIsCreateModalOpen(true);
  }

  // Handle image upload to Cloudflare R2
  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError(
        "Por favor seleccioná un archivo de imagen válido (JPEG, PNG o WEBP)."
      );
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
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
    );
  }

  // Calculations for Reference sum & Discount
  const referenceTotalSum = useMemo(() => {
    return selectedItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );
  }, [selectedItems]);

  const parsedComboPrice = parseFloat(comboPriceInput.replace(",", ".")) || 0;

  const discountPercent = useMemo(() => {
    if (
      referenceTotalSum <= 0 ||
      parsedComboPrice <= 0 ||
      parsedComboPrice >= referenceTotalSum
    ) {
      return null;
    }
    return Math.round(
      ((referenceTotalSum - parsedComboPrice) / referenceTotalSum) * 100
    );
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
      if (statusFilter === "AVAILABLE" && !combo.isAvailable) return false;
      if (statusFilter === "PAUSED" && combo.isAvailable) return false;

      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      const matchName = combo.name.toLowerCase().includes(lower);
      const matchDesc = combo.description?.toLowerCase().includes(lower);
      const matchItem = combo.items.some((i) =>
        i.productName.toLowerCase().includes(lower)
      );
      return matchName || matchDesc || matchItem;
    });
  }, [combosQuery.data, statusFilter, searchTerm]);

  const totalCount = combosQuery.data?.length ?? 0;
  const availableCount =
    combosQuery.data?.filter((c) => c.isAvailable).length ?? 0;
  const pausedCount = totalCount - availableCount;

  if (!branchesQuery.isLoading && branches.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
        <div className="rounded-2xl border border-outline bg-surface-card p-8 shadow-xl flex flex-col items-center">
          <div className="size-16 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold mb-4">
            <Building2 className="size-8" aria-hidden="true" />
          </div>
          <h2 className="font-headline text-xl font-bold text-foreground">
            No hay sucursales registradas
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
            Para crear combos y promociones, primero debés registrar al menos una sucursal en el sistema.
          </p>
          {isGeneralAdmin ? (
            <Link
              to="/admin/sucursales"
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-gold px-5 py-2.5 text-xs font-bold text-brand-dark hover:bg-brand-gold/90 transition-colors shadow-sm"
            >
              <Building2 className="size-4" aria-hidden="true" />
              <span>Ir a Gestión de Sucursales</span>
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground mt-4 font-mono">
              Contactá a un Administrador General para asignar tu sucursal.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6 pb-12">
      {/* Feedback Toast / Floating Notification */}
      {feedbackBanner && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-xs sm:text-sm font-medium shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200 max-w-sm sm:max-w-md",
            feedbackBanner.type === "success"
              ? "border-status-success/30 bg-surface-card text-status-success shadow-lg"
              : "border-status-destructive/30 bg-surface-card text-status-destructive shadow-lg"
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="size-4 text-status-success shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-status-destructive shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            aria-label="Cerrar notificación"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Audit Mode Banner for General Admins */}
      {isGeneralAdmin && (
        <aside
          role="status"
          aria-label="Aviso de modo auditoría"
          className="flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs sm:text-sm text-sky-200"
        >
          <Info className="size-5 shrink-0 text-sky-400 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Modo Auditoría de Sucursal (Solo Lectura)
            </p>
            <p className="text-sky-200/90 leading-relaxed">
              Como administrador general podés consultar los combos y packs vigentes de cada sucursal. La creación, edición y activación de promociones combinadas es potestad exclusiva de los administradores locales.
            </p>
          </div>
        </aside>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/15 text-brand-gold border border-brand-gold/20">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Sucursal {activeBranch?.name ?? ""}
            </span>
          </div>
          <h1 className="mt-2 font-headline text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestión de Combos y Packs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Creá y administrá packs promocionales combinando productos por peso o
            unidad con precios especiales para la sucursal.
          </p>
        </div>

        {!isGeneralAdmin && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="min-h-[44px] w-full sm:w-auto bg-brand-gold text-brand-dark hover:bg-brand-gold-hover font-semibold px-5 text-sm gap-2 shadow-sm"
            >
              <Plus className="size-4" />
              <span>Nuevo Combo</span>
            </Button>
          </div>
        )}
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-outline bg-surface-card p-4">
          <span className="text-xs text-muted-foreground font-medium">
            Total de Combos
          </span>
          <p className="mt-1 font-headline text-2xl font-bold text-foreground">
            {totalCount}
          </p>
        </div>
        <div className="rounded-xl border border-outline bg-surface-card p-4">
          <span className="text-xs text-emerald-400 font-medium">
            Disponibles al Público
          </span>
          <p className="mt-1 font-headline text-2xl font-bold text-emerald-300">
            {availableCount}
          </p>
        </div>
        <div className="rounded-xl border border-outline bg-surface-card p-4">
          <span className="text-xs text-amber-400 font-medium">
            Pausados Temporalmente
          </span>
          <p className="mt-1 font-headline text-2xl font-bold text-amber-300">
            {pausedCount}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o producto..."
            aria-label="Buscar combo por nombre o producto"
            className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-gold"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-outline self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] cursor-pointer",
              statusFilter === "ALL"
                ? "bg-brand-gold text-brand-dark"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("AVAILABLE")}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] cursor-pointer",
              statusFilter === "AVAILABLE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Disponibles ({availableCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PAUSED")}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] cursor-pointer",
              statusFilter === "PAUSED"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Pausados ({pausedCount})
          </button>
        </div>
      </div>

      {/* Combos Grid / List */}
      {combosQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-3">
          <Loader2 className="size-8 animate-spin text-brand-gold" />
          <p className="text-sm">Cargando combos de la sucursal...</p>
        </div>
      ) : combosQuery.isError ? (
        <div className="rounded-xl border border-status-destructive/30 bg-status-destructive/10 p-6 text-center space-y-3">
          <AlertCircle className="size-8 text-status-destructive mx-auto" />
          <p className="text-sm text-status-destructive">
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
        <div className="rounded-2xl border border-dashed border-outline bg-surface-card p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto">
            <Package className="size-6" />
          </div>
          <div>
            <h2 className="font-headline text-base font-semibold text-foreground">
              {searchTerm
                ? "No se encontraron combos con ese criterio"
                : "Aún no hay combos creados"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {searchTerm
                ? "Probá ajustando los términos de búsqueda o cambiando el filtro."
                : "Armá promociones combinando al menos 2 productos para impulsar las ventas en esta sucursal."}
            </p>
          </div>
          {!searchTerm && !isGeneralAdmin && (
            <Button
              type="button"
              onClick={handleOpenCreateModal}
              className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold-hover text-xs font-semibold px-4 cursor-pointer"
            >
              <Plus className="size-4 mr-1" />
              Crear el primer combo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCombos.map((combo) => (
            <ComboCard
              key={combo.id}
              combo={combo}
              isToggling={toggleAvailabilityMutation.isPending}
              isDeleting={deleteMutation.isPending}
              isReadOnly={isGeneralAdmin}
              onToggleAvailability={(target) =>
                toggleAvailabilityMutation.mutate({
                  comboId: target.id,
                  isAvailable: !target.isAvailable,
                })
              }
              onRequestDelete={setDeleteConfirmCombo}
            />
          ))}
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
          <div
            ref={deleteModalRef}
            className="relative z-10 w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-red-500/30 bg-surface-card p-6 shadow-2xl space-y-4 overscroll-contain"
          >
            {/* Mobile Drag Indicator */}
            <div className="flex sm:hidden justify-center items-center -mt-2 pb-1">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>
            <h3
              id="delete-dialog-title"
              className="font-headline text-lg font-bold text-foreground"
            >
              ¿Eliminar el combo "{deleteConfirmCombo.name}"?
            </h3>
            <p className="text-xs text-muted-foreground">
              Esta acción dará de baja el combo en la sucursal{" "}
              {activeBranch.name}. Dejará de ser visible en el catálogo público
              inmediatamente.
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
      <ComboFormModal
        isOpen={isCreateModalOpen}
        branchName={activeBranch?.name ?? ""}
        comboName={comboName}
        onComboNameChange={setComboName}
        comboDescription={comboDescription}
        onComboDescriptionChange={setComboDescription}
        comboPriceInput={comboPriceInput}
        onComboPriceInputChange={setComboPriceInput}
        selectedItems={selectedItems}
        onAddProduct={handleAddProduct}
        onRemoveProduct={handleRemoveProduct}
        onQuantityChange={handleQuantityChange}
        productSearchTerm={productSearchTerm}
        onProductSearchTermChange={setProductSearchTerm}
        availableProducts={productsQuery.data?.items ?? []}
        isLoadingProducts={productsQuery.isLoading}
        uploadedImageUrl={uploadedImageUrl}
        onClearUploadedImage={() => setUploadedImageUrl(null)}
        onImageFileChange={handleImageFileChange}
        isUploadingImage={isUploadingImage}
        referenceTotalSum={referenceTotalSum}
        parsedComboPrice={parsedComboPrice}
        discountPercent={discountPercent}
        formError={formError}
        isSaving={createMutation.isPending}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
}
