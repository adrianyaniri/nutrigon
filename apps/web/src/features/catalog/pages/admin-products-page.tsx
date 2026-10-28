import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Package,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, Role } from "@/features/auth";
import { catalogKeys, useBranches } from "@/features/catalog/hooks/use-catalog-queries";
import { masterCatalogRepository } from "@/features/master-catalog/data/master-catalog-repository";
import {
  branchPricingRepository,
  type BranchProductAdminItem,
  type BranchProductStatus,
} from "@/features/pricing/data/branch-pricing-repository";
import { useDebounce } from "@/hooks";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";
import { BranchOfferModal } from "../components/branch-offer-modal";
import { BranchProductRow } from "../components/branch-product-row";
import {
  calculatePortionPrice,
  formatWeight,
  getPriceReferenceGrams,
  portionFromGrams,
  referencePrice,
  toPricePerKg,
} from "../lib/portion-pricing";

function displayedPrice(price: number, item: BranchProductAdminItem): number {
  return item.saleUnit === "WEIGHT" ? referencePrice(price, item) : price;
}

type FilterTab = "ALL" | BranchProductStatus | "ON_SALE";
type OfferMode = "ALL" | "WEIGHT";

export function AdminProductsPage() {
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

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Draft prices keyed by productId
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [priceReferences, setPriceReferences] = useState<Record<string, 100 | 1000>>({});

  // Offer Modal state
  const [offerModalItem, setOfferModalItem] = useState<BranchProductAdminItem | null>(
    null
  );
  const [promoPriceInput, setPromoPriceInput] = useState("");
  const [offerMode, setOfferMode] = useState<OfferMode>("ALL");
  const [weightOfferInputs, setWeightOfferInputs] = useState<Record<number, string>>({});
  const [offerModalError, setOfferModalError] = useState<string | null>(null);

  // Reset pagination when filter or branch changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearchTerm, selectedCategoryId, branchId]);

  const categoriesQuery = useQuery({
    queryKey: ["master-catalog", "categories"],
    queryFn: () => masterCatalogRepository.listCategories(),
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const queryFilter = useMemo(() => {
    return {
      status:
        activeTab === "ACTIVE" || activeTab === "INACTIVE" || activeTab === "UNCONFIGURED"
          ? activeTab
          : undefined,
      isOnSale: activeTab === "ON_SALE" ? true : undefined,
      search: debouncedSearchTerm.trim() || undefined,
      categoryId: selectedCategoryId || undefined,
      page,
      limit: 20,
    };
  }, [activeTab, debouncedSearchTerm, selectedCategoryId, page]);

  const productsQuery = useQuery({
    queryKey: ["admin", "branch-products", branchId, queryFilter],
    queryFn: () => branchPricingRepository.listProducts(branchId, authToken, queryFilter),
    enabled: Boolean(branchId),
  });

  const countsQuery = useQuery({
    queryKey: ["admin", "branch-products-counts", branchId],
    queryFn: () => branchPricingRepository.getCounts(branchId, authToken),
    enabled: Boolean(branchId),
  });

  const counts = countsQuery.data ?? {
    ACTIVE: 0,
    INACTIVE: 0,
    UNCONFIGURED: 0,
    ON_SALE: 0,
  };
  const totalCount = counts.ACTIVE + counts.INACTIVE + counts.UNCONFIGURED;

  function showFeedback(type: "success" | "error", text: string) {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }

  async function invalidateBranchQueries() {
    const invalidations = [
      queryClient.invalidateQueries({
        queryKey: ["admin", "branch-products", branchId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["admin", "branch-products-counts", branchId],
      }),
    ];
    if (activeBranch) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: catalogKeys.branch(activeBranch.slug),
        })
      );
    }
    await Promise.all(invalidations);
  }

  const upsertMutation = useMutation({
    mutationFn: (vars: {
      productId: string;
      price: number;
      isAvailable: boolean;
      isFeatured?: boolean;
      productName: string;
    }) =>
      branchPricingRepository.upsertProduct(branchId, vars.productId, authToken, {
        price: vars.price,
        isAvailable: vars.isAvailable,
        ...(vars.isFeatured !== undefined ? { isFeatured: vars.isFeatured } : {}),
      }),
    onSuccess: async (_data, vars) => {
      await invalidateBranchQueries();
      showFeedback("success", `Precio y estado actualizados para "${vars.productName}".`);
    },
    onError: (err: unknown) => {
      showFeedback(
        "error",
        err instanceof Error ? err.message : "No se pudo guardar el cambio."
      );
    },
  });

  const offerMutation = useMutation({
    mutationFn: (vars: {
      productId: string;
      isOnSale: boolean;
      promotionalPrice?: number | null;
      weightOffers?: { weightGrams: number; promotionalPrice: number }[];
      productName: string;
    }) =>
      branchPricingRepository.updateOffer(branchId, vars.productId, authToken, {
        isOnSale: vars.isOnSale,
        promotionalPrice: vars.promotionalPrice,
        weightOffers: vars.weightOffers,
      }),
    onSuccess: async (_data, vars) => {
      await invalidateBranchQueries();
      setOfferModalItem(null);
      setOfferModalError(null);
      showFeedback(
        "success",
        vars.isOnSale
          ? `Oferta activada en "${vars.productName}".`
          : `Oferta desactivada en "${vars.productName}".`
      );
    },
    onError: (err: unknown) => {
      setOfferModalError(
        err instanceof Error ? err.message : "No se pudo actualizar la oferta."
      );
    },
  });

  function getDraftPrice(item: BranchProductAdminItem): string {
    const existingDraft = draftPrices[item.productId];
    if (existingDraft !== undefined) return existingDraft;
    return item.price !== null
      ? String(displayedPriceForReference(item.price, item, getPriceReference(item)))
      : "";
  }

  function getPriceReference(item: BranchProductAdminItem): 100 | 1000 {
    return priceReferences[item.productId] ?? getPriceReferenceGrams(item);
  }

  function displayedPriceForReference(
    price: number,
    item: BranchProductAdminItem,
    reference: 100 | 1000
  ): number {
    return item.saleUnit === "WEIGHT"
      ? calculatePortionPrice(price, reference === 100 ? "100g" : "1kg")
      : price;
  }

  function handleDraftPriceChange(productId: string, value: string) {
    setDraftPrices((prev) => ({
      ...prev,
      [productId]: value,
    }));
  }

  function handlePriceReferenceChange(item: BranchProductAdminItem, reference: 100 | 1000) {
    const previousReference = getPriceReference(item);
    if (item.saleUnit !== "WEIGHT" || previousReference === reference) return;

    const existingDraft = draftPrices[item.productId];
    const previousDisplay =
      item.price === null
        ? ""
        : String(displayedPriceForReference(item.price, item, previousReference));
    const canonicalPrice =
      existingDraft === undefined || existingDraft === previousDisplay
        ? item.price
        : toPricePerKg(Number(existingDraft), previousReference);

    setPriceReferences((previous) => ({ ...previous, [item.productId]: reference }));
    if (canonicalPrice !== null && Number.isFinite(canonicalPrice)) {
      setDraftPrices((previous) => ({
        ...previous,
        [item.productId]: String(displayedPriceForReference(canonicalPrice, item, reference)),
      }));
    }
  }

  function handleSavePrice(item: BranchProductAdminItem) {
    if (isGeneralAdmin) {
      showFeedback(
        "error",
        "Los administradores generales no pueden modificar los precios de las sucursales."
      );
      return;
    }

    const raw = getDraftPrice(item).trim();
    const inputPrice = Number(raw);

    if (
      !raw ||
      !Number.isFinite(inputPrice) ||
      inputPrice <= 0 ||
      !/^\d*\.?\d{0,2}$/.test(raw) ||
      inputPrice > 9999999999.99
    ) {
      showFeedback("error", `Ingresá un precio válido para "${item.name}".`);
      return;
    }

    // Saving an unchanged rounded reference must not reprice an existing kg amount.
    const numericPrice =
      item.price !== null &&
      inputPrice === displayedPriceForReference(item.price, item, getPriceReference(item))
        ? item.price
        : item.saleUnit === "WEIGHT"
          ? toPricePerKg(inputPrice, getPriceReference(item))
          : inputPrice;
    if (numericPrice > 9999999999.99) {
      showFeedback("error", "El precio convertido por kilo supera el importe permitido.");
      return;
    }

    const isAvailable =
      item.status === "UNCONFIGURED" ? numericPrice > 0 : item.isAvailable;

    if (isAvailable && numericPrice <= 0) {
      showFeedback(
        "error",
        `Para activar "${item.name}" en la sucursal, el precio debe ser mayor a $0.`
      );
      return;
    }

    upsertMutation.mutate({
      productId: item.productId,
      price: numericPrice,
      isAvailable,
      isFeatured: item.isFeatured,
      productName: item.name,
    });
  }

  function handleToggleAvailability(item: BranchProductAdminItem) {
    if (isGeneralAdmin) {
      showFeedback(
        "error",
        "Los administradores generales no pueden modificar la disponibilidad de los productos de la sucursal."
      );
      return;
    }

    if (item.price === null || item.price <= 0) {
      showFeedback(
        "error",
        `Para activar "${item.name}" en la sucursal, primero configurá un precio mayor a $0.`
      );
      return;
    }

    upsertMutation.mutate({
      productId: item.productId,
      price: item.price,
      isAvailable: !item.isAvailable,
      isFeatured: item.isFeatured,
      productName: item.name,
    });
  }

  function handleToggleFeatured(item: BranchProductAdminItem) {
    if (isGeneralAdmin) {
      showFeedback(
        "error",
        "Los administradores generales no pueden destacar productos en la sucursal."
      );
      return;
    }

    if (item.price === null || item.price <= 0) {
      showFeedback(
        "error",
        `Configurá primero el precio de "${item.name}" antes de destacarlo.`
      );
      return;
    }
    upsertMutation.mutate({
      productId: item.productId,
      price: item.price,
      isAvailable: item.isAvailable,
      isFeatured: !item.isFeatured,
      productName: item.name,
    });
  }

  function openOfferModal(item: BranchProductAdminItem) {
    if (isGeneralAdmin) {
      showFeedback(
        "error",
        "Los administradores generales no pueden configurar ofertas en la sucursal."
      );
      return;
    }

    setOfferModalItem(item);
    setOfferModalError(null);
    const existingWeightOffers = item.weightOffers ?? [];
    setOfferMode(existingWeightOffers.length > 0 ? "WEIGHT" : "ALL");
    setWeightOfferInputs(
      Object.fromEntries(
        existingWeightOffers.map((offer) => [offer.weightGrams, String(offer.promotionalPrice)])
      )
    );
    setPromoPriceInput(
      item.promotionalPrice !== null
        ? String(displayedPrice(item.promotionalPrice, item))
        : ""
    );
  }

  function handleActivateOffer() {
    if (!offerModalItem) return;
    const basePrice = offerModalItem.price ?? 0;

    if (offerMode === "WEIGHT") {
      const weightOffers: { weightGrams: number; promotionalPrice: number }[] = [];
      for (const weightGrams of offerModalItem.weightOptionsGrams ?? []) {
        const input = weightOfferInputs[weightGrams]?.trim() ?? "";
        const promotionalPrice = Number(input);
        if (!input || promotionalPrice === 0) continue;
        const regularPrice = calculatePortionPrice(
          basePrice,
          portionFromGrams(weightGrams)
        );
        if (
          !Number.isFinite(promotionalPrice) ||
          promotionalPrice <= 0 ||
          !/^\d*\.?\d{0,2}$/.test(input) ||
          promotionalPrice >= regularPrice
        ) {
          setOfferModalError(
            `La oferta para ${formatWeight(weightGrams)} debe ser mayor a $0 y menor al precio regular (${formatPrice(regularPrice)}).`
          );
          return;
        }
        weightOffers.push({ weightGrams, promotionalPrice });
      }
      if (weightOffers.length === 0) {
        setOfferModalError("Ingresá al menos un precio promocional para un gramaje.");
        return;
      }
      offerMutation.mutate({
        productId: offerModalItem.productId,
        isOnSale: true,
        promotionalPrice: null,
        weightOffers,
        productName: offerModalItem.name,
      });
      return;
    }

    const inputPromo = Number(promoPriceInput.trim());

    if (
      !promoPriceInput.trim() ||
      !Number.isFinite(inputPromo) ||
      inputPromo <= 0 ||
      !/^\d*\.?\d{0,2}$/.test(promoPriceInput.trim()) ||
      inputPromo > 9999999999.99
    ) {
      setOfferModalError("Ingresá un precio promocional mayor a $0.");
      return;
    }
    const promo =
      offerModalItem.promotionalPrice !== null &&
      inputPromo === displayedPrice(offerModalItem.promotionalPrice, offerModalItem)
        ? offerModalItem.promotionalPrice
        : offerModalItem.saleUnit === "WEIGHT"
          ? toPricePerKg(inputPromo, getPriceReferenceGrams(offerModalItem))
          : inputPromo;
    if (promo >= basePrice) {
      setOfferModalError(
        `El precio promocional debe ser menor al precio regular (${formatPrice(
          displayedPrice(basePrice, offerModalItem)
        )}).`
      );
      return;
    }

    offerMutation.mutate({
      productId: offerModalItem.productId,
      isOnSale: true,
      promotionalPrice: promo,
      productName: offerModalItem.name,
    });
  }

  function handleRemoveOffer() {
    if (!offerModalItem) return;
    offerMutation.mutate({
      productId: offerModalItem.productId,
      isOnSale: false,
      promotionalPrice: null,
      weightOffers: [],
      productName: offerModalItem.name,
    });
  }

  const items = productsQuery.data?.items ?? [];
  const totalPages = productsQuery.data?.totalPages ?? 1;

  const filterTabs: {
    id: FilterTab;
    label: string;
    count: number;
    accent?: string;
  }[] = [
    { id: "ALL", label: "Todos", count: totalCount },
    { id: "ACTIVE", label: "Activos en tienda", count: counts.ACTIVE },
    { id: "ON_SALE", label: "En oferta", count: counts.ON_SALE, accent: "gold" },
    { id: "INACTIVE", label: "Pausados", count: counts.INACTIVE },
    { id: "UNCONFIGURED", label: "Sin precio", count: counts.UNCONFIGURED },
  ];

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
            Para fijar precios y ofertas, primero debés registrar al menos una sucursal en
            el sistema.
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
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6 text-foreground pb-12">
      {/* Top Operational Header */}
      <section className="rounded-2xl border border-outline bg-surface-card p-4 sm:p-6 shadow-xl">
        <div className="space-y-1.5">
          <h1 className="font-headline text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            Gestión de Precios y Ofertas por Sucursal
          </h1>

          <p className="hidden sm:block text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Configurá el precio por kilogramo, por 100 g o por unidad, habilitá productos
            en el mostrador online y activá ofertas exclusivas para{" "}
            <strong className="text-foreground">
              Sucursal {activeBranch?.name ?? ""}
            </strong>
            .
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed sm:hidden">
            Gestioná precios, disponibilidad y ofertas de{" "}
            <strong className="text-foreground">Sucursal {activeBranch?.name ?? ""}</strong>.
          </p>
        </div>

        {/* Audit Mode Banner for General Admins */}
        {isGeneralAdmin && (
          <aside
            role="status"
            aria-label="Aviso de modo auditoría"
            className="mt-4 flex items-start gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs sm:text-sm text-sky-200"
          >
            <Info className="size-5 shrink-0 text-sky-400 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Modo Auditoría de Sucursal (Solo Lectura)
              </p>
              <p className="text-sky-200/90 leading-relaxed">
                Como administrador general podés consultar los precios, ofertas y
                disponibilidad de cada sucursal. La fijación de precios, activación de
                ofertas y cambios de disponibilidad son potestad exclusiva de los
                administradores locales.
              </p>
            </div>
          </aside>
        )}

        {/* Status Counter Tabs */}
        <div
          role="tablist"
          aria-label="Filtrar por estado en la sucursal"
          className="mt-4 grid grid-cols-2 gap-2 border-t border-outline/60 pt-4 sm:mt-6 sm:grid-cols-3 sm:gap-2.5 sm:pt-5 lg:grid-cols-5"
        >
          {filterTabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex min-h-[48px] min-w-0 items-center justify-between gap-1.5 rounded-xl border px-2.5 py-2.5 text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:outline-none sm:px-3.5",
                  tab.id === "UNCONFIGURED" && "col-span-2 sm:col-span-1",
                  isSelected
                    ? "border-brand-gold bg-brand-gold/15 text-foreground shadow-sm"
                    : "border-outline/60 bg-surface text-muted-foreground hover:border-outline hover:text-foreground"
                )}
              >
                <span className="min-w-0 text-xs font-semibold leading-snug">
                  {tab.id === "ACTIVE" ? (
                    <><span className="sm:hidden">Activos</span><span className="hidden sm:inline">{tab.label}</span></>
                  ) : tab.label}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                    isSelected
                      ? "bg-brand-gold text-brand-dark"
                      : "bg-surface-elevated text-foreground/80"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

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

      {/* Search & Filter Toolbar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              aria-label="Buscar producto en la sucursal"
              className="min-h-[44px] w-full rounded-xl border border-outline bg-surface pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground caret-brand-gold focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            aria-label="Filtrar por categoría"
            className="min-h-[44px] w-full min-w-0 rounded-xl border border-outline bg-surface px-3.5 text-xs text-foreground focus:outline-none focus:border-brand-gold cursor-pointer sm:w-auto sm:text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-muted-foreground">
          Mostrando <strong className="text-foreground">{items.length}</strong> de{" "}
          <strong className="text-foreground">{productsQuery.data?.total ?? 0}</strong>{" "}
          productos
        </div>
      </section>

      {/* Products List */}
      <section className="space-y-3">
        {productsQuery.isPending ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-outline bg-surface-card py-16 text-muted-foreground gap-3">
            <Loader2 className="size-6 animate-spin text-brand-gold" />
            <span className="text-sm">Cargando productos de la sucursal...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-outline bg-surface-card py-14 px-4 text-center gap-3">
            <Package className="size-10 text-brand-gold/60" />
            <h2 className="font-headline text-base font-bold text-foreground">
              No encontramos productos con este filtro
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm">
              Probá cambiando de pestaña o limpiando el término de búsqueda.
            </p>
            {(activeTab !== "ALL" || searchTerm || selectedCategoryId) && (
              <Button
                variant="outline"
                className="min-h-[44px] mt-1"
                onClick={() => {
                  setActiveTab("ALL");
                  setSearchTerm("");
                  setSelectedCategoryId("");
                }}
              >
                Restablecer filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <BranchProductRow
                key={item.productId}
                item={item}
                draftValue={getDraftPrice(item)}
                priceReferenceGrams={getPriceReference(item)}
                isSaving={upsertMutation.isPending}
                isReadOnly={isGeneralAdmin}
                onDraftPriceChange={handleDraftPriceChange}
                onPriceReferenceChange={handlePriceReferenceChange}
                onSavePrice={handleSavePrice}
                onToggleAvailability={handleToggleAvailability}
                onToggleFeatured={handleToggleFeatured}
                onOpenOfferModal={openOfferModal}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-outline">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[44px] text-xs"
            >
              <ChevronLeft className="size-4 mr-1" /> Anterior
            </Button>

            <span className="text-xs text-muted-foreground">
              Página <strong className="text-foreground">{page}</strong> de{" "}
              <strong className="text-foreground">{totalPages}</strong>
            </span>

            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[44px] text-xs"
            >
              Siguiente <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        )}
      </section>

      {/* Offer Configuration Modal */}
      <BranchOfferModal
        item={offerModalItem}
        promoPriceInput={promoPriceInput}
        offerMode={offerMode}
        onOfferModeChange={(mode) => {
          setOfferMode(mode);
          setOfferModalError(null);
        }}
        weightOfferInputs={weightOfferInputs}
        onWeightOfferInputChange={(weightGrams, value) => {
          setWeightOfferInputs((current) => ({ ...current, [weightGrams]: value }));
          setOfferModalError(null);
        }}
        onPromoPriceInputChange={(val) => {
          setPromoPriceInput(val);
          setOfferModalError(null);
        }}
        error={offerModalError}
        isSaving={offerMutation.isPending}
        onClose={() => setOfferModalItem(null)}
        onActivateOffer={handleActivateOffer}
        onRemoveOffer={handleRemoveOffer}
      />
    </div>
  );
}
