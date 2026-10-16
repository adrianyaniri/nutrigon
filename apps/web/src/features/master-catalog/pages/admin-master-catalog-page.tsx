import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderPlus,
  Hash,
  Layers,
  Loader2,
  Package,
  Plus,
  Scale,
  Search,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DEFAULT_PRODUCT_IMAGE } from "@/components/atoms/product-image";
import { useAuth, Role } from "@/features/auth";
import type { SaleUnit } from "@/features/catalog/types";
import { cn } from "@/lib/utils/cn";
import { masterCatalogRepository } from "../data/master-catalog-repository";
import type {
  CreateCategoryInput,
  CreateMasterProductInput,
  MasterProduct,
  UpdateMasterProductInput,
} from "../types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

function slugifyCategoryName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminMasterCatalogPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;
  const authToken = token ?? "mock-jwt-token";

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
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

  // Category Create Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategoryId, statusFilter]);

  // Handle ESC key for modal dismissals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isProductModalOpen) setIsProductModalOpen(false);
        if (isCategoryModalOpen) setIsCategoryModalOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProductModalOpen, isCategoryModalOpen]);

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
        search: searchTerm.trim(),
        categoryId: selectedCategoryId || undefined,
        isActive: isActiveParam,
        page,
      },
    ],
    queryFn: () =>
      masterCatalogRepository.listProducts(authToken, {
        search: searchTerm.trim() || undefined,
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
    } else {
      createProductMutation.mutate(payload);
    }
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
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-gold px-5 text-xs font-semibold text-surface hover:bg-brand-gold/90"
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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-6">
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
              setCategoryName("");
              setCategorySlug("");
              setCategoryFormError(null);
              setIsCategoryModalOpen(true);
            }}
            className="min-h-[44px] border-white/[0.15] text-xs font-semibold gap-2"
          >
            <FolderPlus className="size-4 text-brand-gold" />
            <span>Nueva Categoría</span>
          </Button>

          <Button
            type="button"
            onClick={openCreateProductModal}
            className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 font-semibold px-5 text-xs sm:text-sm gap-2 shadow-sm"
          >
            <Plus className="size-4" />
            <span>Nuevo Producto Maestro</span>
          </Button>
        </div>
      </div>

      {/* Operational Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Productos en vista</span>
            <span className="font-headline text-base font-bold text-white tabular-nums">{totalProducts}</span>
          </div>
          <div className="h-4 w-px bg-white/[0.1]" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <span className="text-brand-gold font-medium">Categorías Maestras</span>
            <span className="font-headline text-base font-bold text-brand-gold tabular-nums">{categories.length}</span>
          </div>
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
              className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] pl-9 pr-9 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
            className="min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111215] border border-white/[0.08] self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
              statusFilter === "ALL"
                ? "bg-brand-gold text-surface"
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
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-3">
          <AlertCircle className="size-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-200">
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
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-surface-card p-12 text-center space-y-4">
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
                className="min-h-[44px] text-xs font-semibold border-white/[0.15]"
              >
                Limpiar filtros
              </Button>
            )}
            <Button
              type="button"
              onClick={openCreateProductModal}
              className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 text-xs font-semibold px-4"
            >
              <Plus className="size-4 mr-1" />
              Crear Producto Maestro
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const categoryLabel =
              categoryNameById.get(product.categoryId) ?? "Categoría General";
            const hasImage = product.imageUrls && product.imageUrls.length > 0;

            return (
              <article
                key={product.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border bg-surface-card p-4 transition-all hover:border-white/[0.18]",
                  product.isActive
                    ? "border-white/[0.08]"
                    : "border-amber-500/30 bg-amber-500/[0.02] opacity-80"
                )}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="size-14 sm:size-16 rounded-xl overflow-hidden bg-[#111215] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <img
                      src={hasImage ? product.imageUrls[0] : DEFAULT_PRODUCT_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/Logo.jpeg";
                      }}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/[0.06] text-zinc-300 shrink-0 whitespace-nowrap">
                        <Layers className="size-3 text-brand-gold shrink-0" />
                        <span>{categoryLabel}</span>
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono border shrink-0 whitespace-nowrap",
                          product.saleUnit === "WEIGHT"
                            ? "bg-brand-gold/10 text-brand-gold border-brand-gold/25"
                            : "bg-sky-500/10 text-sky-300 border-sky-500/25"
                        )}
                      >
                        <Scale className="size-3 shrink-0" />
                        <span>
                          {product.saleUnit === "WEIGHT"
                            ? "Granel · Venta por kg"
                            : "Por Unidad"}
                        </span>
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold font-mono shrink-0 whitespace-nowrap",
                          product.isActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        )}
                      >
                        {product.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>

                    <h3 className="font-headline text-sm sm:text-base font-bold text-white truncate">
                      {product.name}
                    </h3>

                    {product.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {product.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-0.5 text-[11px] text-zinc-400 font-mono">
                      {product.code && (
                        <span className="inline-flex items-center gap-1">
                          <Hash className="size-3 text-zinc-500" />
                          Cód: <strong className="text-zinc-200">{product.code}</strong>
                        </span>
                      )}
                      {product.barcode && (
                        <span className="inline-flex items-center gap-1">
                          <Barcode className="size-3 text-zinc-500" />
                          EAN: <strong className="text-zinc-200">{product.barcode}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => openEditProductModal(product)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs font-semibold text-zinc-200 hover:border-brand-gold hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit3 className="size-3.5 text-brand-gold" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    disabled={toggleActiveMutation.isPending}
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        product,
                        nextActive: !product.isActive,
                      })
                    }
                    className={cn(
                      "inline-flex min-h-[44px] items-center justify-center rounded-xl border px-3.5 text-xs font-semibold transition-colors cursor-pointer",
                      product.isActive
                        ? "border-white/[0.1] bg-[#111215] text-zinc-300 hover:border-amber-500/40 hover:text-amber-300"
                        : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                    )}
                  >
                    {product.isActive ? "Desactivar" : "Reactivar"}
                  </button>
                </div>
              </article>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
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
      {isProductModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="master-product-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsProductModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/[0.1] bg-surface-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
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
                onClick={() => setIsProductModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                aria-label="Cerrar modal de producto maestro"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleProductSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {productFormError && (
                <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-red-400" />
                  <span>{productFormError}</span>
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
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="ej. Almendras Nonpareil Tostadas"
                  className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
                    onChange={(e) => setProductCategoryId(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
                    onChange={(e) => setProductSaleUnit(e.target.value as SaleUnit)}
                    className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
                    onChange={(e) => setProductCode(e.target.value)}
                    placeholder="ej. FS-015"
                    className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs font-mono text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
                    onChange={(e) => setProductBarcode(e.target.value)}
                    placeholder="ej. 7791234567890"
                    className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs font-mono text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="ej. Producto natural seleccionado, ideal para repostería o snack saludable."
                  className="w-full rounded-xl border border-white/[0.1] bg-[#111215] p-3 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold resize-none"
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
                        onClick={() => setProductImageUrl(null)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity"
                        title="Quitar imagen"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative size-16 rounded-xl border border-dashed border-white/[0.15] bg-[#111215] flex items-center justify-center text-zinc-500 shrink-0 overflow-hidden">
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
                    <label className="inline-flex min-h-[44px] items-center gap-2 px-3.5 py-2 rounded-xl border border-white/[0.1] bg-[#111215] text-xs font-semibold text-zinc-300 hover:text-white hover:border-brand-gold cursor-pointer transition-colors">
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
                        accept="image/*"
                        disabled={isUploadingImage}
                        onChange={handleImageFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Se sincroniza automáticamente en el catálogo de las 3 sucursales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProductModalOpen(false)}
                  className="min-h-[44px] text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createProductMutation.isPending ||
                    updateProductMutation.isPending ||
                    isUploadingImage ||
                    productName.trim().length < 2
                  }
                  className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 font-semibold text-xs px-5"
                >
                  {createProductMutation.isPending || updateProductMutation.isPending ? (
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
      )}

      {/* Create Category Modal */}
      {isCategoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs"
            onClick={() => setIsCategoryModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-white/[0.1] bg-surface-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="category-modal-title"
                className="font-headline text-lg font-bold text-white"
              >
                Nueva Categoría Maestra
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                aria-label="Cerrar modal de categoría"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {categoryFormError && (
                <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
                  {categoryFormError}
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
                    setCategoryName(e.target.value);
                    setCategorySlug(slugifyCategoryName(e.target.value));
                  }}
                  placeholder="ej. Legumbres y Semillas"
                  className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
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
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="ej. legumbres-y-semillas"
                  className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3.5 text-xs font-mono text-zinc-300 placeholder:text-zinc-500 caret-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="min-h-[44px] text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isPending || categoryName.trim().length < 2}
                  className="min-h-[44px] bg-brand-gold text-surface hover:bg-brand-gold/90 font-semibold text-xs px-5"
                >
                  {createCategoryMutation.isPending ? "Creando..." : "Guardar Categoría"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
