import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FolderCog,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, Role } from "@/features/auth";
import type { SaleUnit } from "@/features/catalog/types";
import { useDebounce } from "@/hooks";
import { cn } from "@/lib/utils/cn";
import { MasterCategoryModal } from "../components/master-category-modal";
import { slugifyCategoryName } from "../lib/slugify";
import { MasterProductCard } from "../components/master-product-card";
import { MasterProductFormModal } from "../components/master-product-form-modal";
import { masterCatalogRepository } from "../data/master-catalog-repository";
import type {
  CreateCategoryInput,
  CreateMasterProductInput,
  MasterProduct,
  UpdateCategoryInput,
  UpdateMasterProductInput,
} from "../types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export function AdminMasterCatalogPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;
  const authToken = token ?? "mock-jwt-token";

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Product Create / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
  const [productName, setProductName] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productSaleUnit, setProductSaleUnit] = useState<SaleUnit>("WEIGHT");
  const [productCode, setProductCode] = useState("");
  const [productBarcode, setProductBarcode] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Category Create / Edit Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, selectedCategoryId, statusFilter]);

  // Categories Query
  const categoriesQuery = useQuery({
    queryKey: ["master-catalog", "categories"],
    queryFn: () => masterCatalogRepository.listCategories(),
    enabled: isGeneralAdmin,
  });

  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  );

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      map.set(cat.id, cat.name);
    }
    return map;
  }, [categories]);

  // Products Query
  const isActiveParam =
    statusFilter === "ACTIVE"
      ? true
      : statusFilter === "INACTIVE"
      ? false
      : undefined;

  const productsQuery = useQuery({
    queryKey: [
      "master-catalog",
      "products",
      {
        search: debouncedSearchTerm.trim(),
        categoryId: selectedCategoryId || undefined,
        isActive: isActiveParam,
        page,
      },
    ],
    queryFn: () =>
      masterCatalogRepository.listProducts(authToken, {
        search: debouncedSearchTerm.trim() || undefined,
        categoryId: selectedCategoryId || undefined,
        isActive: isActiveParam,
        page,
        limit: 20,
      }),
    enabled: isGeneralAdmin,
  });

  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: (input: CreateMasterProductInput) =>
      masterCatalogRepository.createProduct(authToken, input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["master-catalog", "products"] });
      queryClient.invalidateQueries({ queryKey: ["branch-products"] });
      setIsProductModalOpen(false);
      setFeedbackBanner({
        type: "success",
        text: `Producto maestro "${created.name}" creado. Ya está disponible para asignar precios en las sucursales.`,
      });
    },
    onError: (err) => {
      setProductFormError(
        err instanceof Error ? err.message : "No se pudo crear el producto maestro."
      );
    },
  });

  // Update Product Mutation
  const updateProductMutation = useMutation({
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: UpdateMasterProductInput;
    }) => masterCatalogRepository.updateProduct(authToken, productId, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["master-catalog", "products"] });
      queryClient.invalidateQueries({ queryKey: ["branch-products"] });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setFeedbackBanner({
        type: "success",
        text: `Producto maestro "${updated.name}" actualizado correctamente.`,
      });
    },
    onError: (err) => {
      setProductFormError(
        err instanceof Error ? err.message : "No se pudo actualizar el producto maestro."
      );
    },
  });

  // Toggle Active Status Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({
      product,
      nextActive,
    }: {
      product: MasterProduct;
      nextActive: boolean;
    }) =>
      nextActive
        ? masterCatalogRepository.updateProduct(authToken, product.id, {
            isActive: true,
          })
        : masterCatalogRepository.deleteProduct(authToken, product.id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["master-catalog", "products"] });
      queryClient.invalidateQueries({ queryKey: ["branch-products"] });
      setFeedbackBanner({
        type: "success",
        text: `El producto "${updated.name}" fue ${
          updated.isActive ? "reactivado" : "desactivado"
        } en el catálogo maestro.`,
      });
    },
    onError: (err) => {
      setFeedbackBanner({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Error al cambiar el estado del producto maestro.",
      });
    },
  });

  // Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      masterCatalogRepository.createCategory(authToken, input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["master-catalog", "categories"] });
      setIsCategoryModalOpen(false);
      setEditingCategoryId("");
      setCategoryName("");
      setCategorySlug("");
      setCategoryFormError(null);
      setFeedbackBanner({
        type: "success",
        text: `Categoría "${created.name}" creada exitosamente.`,
      });
    },
    onError: (err) => {
      setCategoryFormError(
        err instanceof Error ? err.message : "No se pudo crear la categoría."
      );
    },
  });

  // Update Category Mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: UpdateCategoryInput;
    }) => masterCatalogRepository.updateCategory(authToken, categoryId, input),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["master-catalog", "categories"] });
      setIsCategoryModalOpen(false);
      setEditingCategoryId("");
      setCategoryName("");
      setCategorySlug("");
      setCategoryFormError(null);
      setFeedbackBanner({
        type: "success",
        text: `Categoría "${updated.name}" actualizada exitosamente.`,
      });
    },
    onError: (err) => {
      setCategoryFormError(
        err instanceof Error ? err.message : "No se pudo actualizar la categoría."
      );
    },
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) =>
      masterCatalogRepository.deleteCategory(authToken, categoryId),
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ["master-catalog", "categories"] });
      if (selectedCategoryId === deleted.id) {
        setSelectedCategoryId("");
      }
      setIsCategoryModalOpen(false);
      setEditingCategoryId("");
      setCategoryName("");
      setCategorySlug("");
      setCategoryFormError(null);
      setFeedbackBanner({
        type: "success",
        text: `Categoría "${deleted.name}" eliminada exitosamente.`,
      });
    },
    onError: (err) => {
      setCategoryFormError(
        err instanceof Error ? err.message : "No se pudo eliminar la categoría."
      );
    },
  });

  function openCreateProductModal() {
    setEditingProduct(null);
    setProductName("");
    setProductCategoryId(categories[0]?.id ?? "");
    setProductSaleUnit("WEIGHT");
    setProductCode("");
    setProductBarcode("");
    setProductDescription("");
    setProductImageUrl(null);
    setProductFormError(null);
    setIsProductModalOpen(true);
  }

  function openEditProductModal(product: MasterProduct) {
    setEditingProduct(product);
    setProductName(product.name);
    setProductCategoryId(product.categoryId);
    setProductSaleUnit(product.saleUnit);
    setProductCode(product.code ?? "");
    setProductBarcode(product.barcode ?? "");
    setProductDescription(product.description ?? "");
    setProductImageUrl(product.imageUrls[0] ?? null);
    setProductFormError(null);
    setIsProductModalOpen(true);
  }

  function handleSelectCategoryMode(nextId: string) {
    setEditingCategoryId(nextId);
    setCategoryFormError(null);

    if (!nextId) {
      setCategoryName("");
      setCategorySlug("");
      return;
    }

    const found = categories.find((c) => c.id === nextId);
    if (!found) return;

    setCategoryName(found.name);
    setCategorySlug(found.slug);
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProductFormError("Seleccioná una imagen válida (WEBP, JPEG o PNG).");
      return;
    }

    try {
      setIsUploadingImage(true);
      setProductFormError(null);
      const url = await masterCatalogRepository.uploadProductImage(authToken, file);
      setProductImageUrl(url);
    } catch (err) {
      setProductFormError(
        err instanceof Error
          ? err.message
          : "Error al subir la imagen a Cloudflare R2."
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProductFormError(null);

    if (productName.trim().length < 2) {
      setProductFormError("El nombre del producto debe tener al menos 2 caracteres.");
      return;
    }

    const effectiveCategoryId = productCategoryId || categories[0]?.id || "";
    if (!effectiveCategoryId) {
      setProductFormError("Seleccioná una categoría para el producto.");
      return;
    }

    const payload: CreateMasterProductInput = {
      name: productName.trim(),
      categoryId: effectiveCategoryId,
      saleUnit: productSaleUnit,
      code: productCode.trim() || null,
      barcode: productBarcode.trim() || null,
      description: productDescription.trim() || null,
      imageUrls: productImageUrl ? [productImageUrl] : [],
    };

    if (editingProduct) {
      updateProductMutation.mutate({
        productId: editingProduct.id,
        input: payload,
      });
      return;
    }

    createProductMutation.mutate(payload);
  }

  function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();
    setCategoryFormError(null);

    if (categoryName.trim().length < 2) {
      setCategoryFormError("El nombre de la categoría debe tener al menos 2 caracteres.");
      return;
    }

    const finalSlug = (categorySlug.trim() || slugifyCategoryName(categoryName)).toLowerCase();
    if (!/^[a-z0-9-]+$/.test(finalSlug)) {
      setCategoryFormError("El slug solo puede contener letras minúsculas, números y guiones.");
      return;
    }

    if (editingCategoryId) {
      updateCategoryMutation.mutate({
        categoryId: editingCategoryId,
        input: {
          name: categoryName.trim(),
          slug: finalSlug,
        },
      });
      return;
    }

    createCategoryMutation.mutate({
      name: categoryName.trim(),
      slug: finalSlug,
      orderIndex: categories.length + 1,
    });
  }

  if (!isGeneralAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 flex items-center justify-center">
        <div className="w-full rounded-2xl border border-amber-500/30 bg-surface-card p-8 text-center space-y-4">
          <div className="size-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="size-6" />
          </div>
          <h1 className="font-headline text-xl font-bold text-white">
            Acceso exclusivo para Administración General
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            El Catálogo Maestro define los productos globales y categorías de todas las sucursales.
            Como encargado de sucursal, podés gestionar los precios, ofertas y combos de tu local.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/productos"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-gold px-5 text-xs font-semibold text-brand-dark hover:bg-brand-gold/90"
            >
              Ir a Precios y Ofertas de mi Sucursal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const products = productsQuery.data?.items ?? [];
  const totalProducts = productsQuery.data?.total ?? 0;
  const totalPages = productsQuery.data?.totalPages ?? 1;

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
              ? "bg-status-success/10 border-status-success/30 text-status-success"
              : "bg-status-destructive/10 border-status-destructive/30 text-status-destructive"
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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline pb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Catálogo Maestro de Productos
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Administrá la base global de productos y categorías de Nutrigon. Cada producto dado de
            alta acá queda disponible para que las sucursales configuren su precio y stock local.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditingCategoryId("");
              setCategoryName("");
              setCategorySlug("");
              setCategoryFormError(null);
              setIsCategoryModalOpen(true);
            }}
            className="min-h-[44px] border-outline hover:bg-surface-hover text-xs font-semibold gap-2"
            aria-label="Nueva Categoría o Gestionar Categorías"
          >
            <FolderCog className="size-4 text-brand-gold" />
            <span>Gestionar Categorías ({categories.length})</span>
          </Button>

          <Button
            type="button"
            onClick={openCreateProductModal}
            className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold/90 font-semibold px-5 text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="size-4" />
            <span>Nuevo Producto Maestro</span>
          </Button>
        </div>
      </div>

      {/* Operational Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card border border-outline">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Productos en vista</span>
            <span className="font-headline text-base font-bold text-white tabular-nums">
              {totalProducts}
            </span>
          </div>
          <div className="h-4 w-px bg-outline" aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              setEditingCategoryId("");
              setCategoryName("");
              setCategorySlug("");
              setCategoryFormError(null);
              setIsCategoryModalOpen(true);
            }}
            title="Hacé clic para ver y editar todas las categorías"
            aria-label="Ver y editar categorías maestras"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <span className="text-brand-gold font-medium group-hover:underline">Categorías Maestras</span>
            <span className="font-headline text-base font-bold text-brand-gold tabular-nums">
              {categories.length}
            </span>
            <Pencil className="size-3 text-brand-gold/70 group-hover:text-brand-gold ml-0.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="size-3.5 text-emerald-400" />
          <span>Sincronizado con 3 sucursales</span>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código interno o EAN..."
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-9 pr-9 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            aria-label="Filtrar por categoría"
            className="min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-outline self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
              statusFilter === "ALL"
                ? "bg-brand-gold text-brand-dark"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE")}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
              statusFilter === "ACTIVE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Activos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("INACTIVE")}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
              statusFilter === "INACTIVE"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Products List */}
      {productsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-zinc-400 space-y-3">
          <Loader2 className="size-8 animate-spin text-brand-gold" />
          <p className="text-sm">Cargando catálogo maestro...</p>
        </div>
      ) : productsQuery.isError ? (
        <div className="rounded-xl border border-status-destructive/30 bg-status-destructive/10 p-6 text-center space-y-3">
          <AlertCircle className="size-8 text-status-destructive mx-auto" />
          <p className="text-sm text-status-destructive">
            {productsQuery.error instanceof Error
              ? productsQuery.error.message
              : "No se pudo cargar el catálogo maestro."}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => productsQuery.refetch()}
            className="min-h-[44px] text-xs"
          >
            Reintentar
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline bg-surface-card p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center mx-auto">
            <Package className="size-6" />
          </div>
          <div>
            <h3 className="font-headline text-base font-semibold text-white">
              No se encontraron productos maestros
            </h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
              {searchTerm || selectedCategoryId || statusFilter !== "ALL"
                ? "No hay productos que coincidan con los filtros aplicados. Podés restablecerlos o crear uno nuevo."
                : "Ajustá los filtros de búsqueda o creá un nuevo producto global para sumarlo al catálogo."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {(searchTerm || selectedCategoryId || statusFilter !== "ALL") && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategoryId("");
                  setStatusFilter("ALL");
                }}
                className="min-h-[44px] text-xs font-semibold border-outline hover:bg-surface-hover"
              >
                Limpiar filtros
              </Button>
            )}
            <Button
              type="button"
              onClick={openCreateProductModal}
              className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold/90 text-xs font-semibold px-4"
            >
              <Plus className="size-4 mr-1" />
              Crear Producto Maestro
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <MasterProductCard
              key={product.id}
              product={product}
              categoryLabel={
                categoryNameById.get(product.categoryId) ?? "Categoría General"
              }
              isToggling={toggleActiveMutation.isPending}
              onEdit={openEditProductModal}
              onToggleActive={(target) =>
                toggleActiveMutation.mutate({
                  product: target,
                  nextActive: !target.isActive,
                })
              }
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-outline">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-[44px] text-xs"
              >
                <ChevronLeft className="size-4 mr-1" /> Anterior
              </Button>

              <span className="text-xs text-zinc-400">
                Página <strong className="text-white">{page}</strong> de{" "}
                <strong className="text-white">{totalPages}</strong>
              </span>

              <Button
                type="button"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="min-h-[44px] text-xs"
              >
                Siguiente <ChevronRight className="size-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Product Modal */}
      <MasterProductFormModal
        isOpen={isProductModalOpen}
        editingProduct={editingProduct}
        categories={categories}
        productName={productName}
        onProductNameChange={setProductName}
        productCategoryId={productCategoryId}
        onProductCategoryIdChange={setProductCategoryId}
        productSaleUnit={productSaleUnit}
        onProductSaleUnitChange={setProductSaleUnit}
        productCode={productCode}
        onProductCodeChange={setProductCode}
        productBarcode={productBarcode}
        onProductBarcodeChange={setProductBarcode}
        productDescription={productDescription}
        onProductDescriptionChange={setProductDescription}
        productImageUrl={productImageUrl}
        onClearProductImage={() => setProductImageUrl(null)}
        onImageFileChange={handleImageFileChange}
        isUploadingImage={isUploadingImage}
        isSaving={createProductMutation.isPending || updateProductMutation.isPending}
        formError={productFormError}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleProductSubmit}
      />

      {/* Create / Edit Category Modal */}
      <MasterCategoryModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        products={products}
        editingCategoryId={editingCategoryId}
        onSelectCategoryMode={handleSelectCategoryMode}
        categoryName={categoryName}
        onCategoryNameChange={setCategoryName}
        categorySlug={categorySlug}
        onCategorySlugChange={setCategorySlug}
        formError={categoryFormError}
        isSaving={createCategoryMutation.isPending || updateCategoryMutation.isPending}
        isDeleting={deleteCategoryMutation.isPending}
        onDeleteCategory={(categoryId) => deleteCategoryMutation.mutate(categoryId)}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCategorySubmit}
      />
    </div>
  );
}
