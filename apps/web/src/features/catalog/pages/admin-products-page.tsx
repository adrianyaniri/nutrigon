import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Package,
  PauseCircle,
  Percent,
  Search,
  Sparkles,
  Store,
  Tag,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProductImage } from "@/components/atoms/product-image";
import { Button } from "@/components/ui/button";
import { useAuth, Role } from "@/features/auth";
import { catalogKeys, useBranches } from "@/features/catalog/hooks/use-catalog-queries";
import {
  branchPricingRepository,
  type BranchProductAdminItem,
  type BranchProductStatus,
} from "@/features/pricing/data/branch-pricing-repository";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils/cn";

type FilterTab = "ALL" | BranchProductStatus | "ON_SALE";

const FALLBACK_BRANCHES = [
  { id: "b-origone", slug: "origone", name: "Origone" },
  { id: "b-pedrodiaz", slug: "pedro-diaz", name: "Pedro Díaz" },
  { id: "b-wmorris", slug: "w-morris", name: "William Morris" },
] as const;

export function AdminProductsPage() {
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

  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Draft prices keyed by productId
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});

  // Offer Modal state
  const [offerModalItem, setOfferModalItem] = useState<BranchProductAdminItem | null>(null);
  const [promoPriceInput, setPromoPriceInput] = useState("");
  const [offerModalError, setOfferModalError] = useState<string | null>(null);

  // Reset pagination when filter or branch changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm, branchId]);

  const queryFilter = useMemo(() => {
    return {
      status:
        activeTab === "ACTIVE" || activeTab === "INACTIVE" || activeTab === "UNCONFIGURED"
          ? activeTab
          : undefined,
      isOnSale: activeTab === "ON_SALE" ? true : undefined,
      search: searchTerm.trim() || undefined,
      page,
      limit: 20,
    };
  }, [activeTab, searchTerm, page]);

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
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "branch-products", branchId] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "branch-products-counts", branchId] }),
      queryClient.invalidateQueries({ queryKey: catalogKeys.branch(activeBranch.slug) }),
    ]);
  }

  const upsertMutation = useMutation({
    mutationFn: (vars: {
      productId: string;
      price: number;
      isAvailable: boolean;
      productName: string;
    }) =>
      branchPricingRepository.upsertProduct(branchId, vars.productId, authToken, {
        price: vars.price,
        isAvailable: vars.isAvailable,
      }),
    onSuccess: async (_data, vars) => {
      await invalidateBranchQueries();
      showFeedback(
        "success",
        `Precio y estado actualizados para "${vars.productName}".`
      );
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
      productName: string;
    }) =>
      branchPricingRepository.updateOffer(branchId, vars.productId, authToken, {
        isOnSale: vars.isOnSale,
        promotionalPrice: vars.promotionalPrice,
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
    return item.price !== null ? String(item.price) : "";
  }

  function handleSavePrice(item: BranchProductAdminItem, nextAvailable?: boolean) {
    const raw = getDraftPrice(item).trim();
    const numericPrice = Number(raw);

    if (!raw || Number.isNaN(numericPrice) || numericPrice < 0) {
      showFeedback("error", `Ingresá un precio válido para "${item.name}".`);
      return;
    }

    const isAvailable =
      nextAvailable !== undefined
        ? nextAvailable
        : item.status === "UNCONFIGURED"
          ? numericPrice > 0
          : item.isAvailable;

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
      productName: item.name,
    });
  }

  function openOfferModal(item: BranchProductAdminItem) {
    setOfferModalItem(item);
    setOfferModalError(null);
    setPromoPriceInput(
      item.promotionalPrice !== null ? String(item.promotionalPrice) : ""
    );
  }

  function handleActivateOffer() {
    if (!offerModalItem) return;
    const basePrice = offerModalItem.price ?? 0;
    const promo = Number(promoPriceInput.trim());

    if (!promoPriceInput.trim() || Number.isNaN(promo) || promo <= 0) {
      setOfferModalError("Ingresá un precio promocional mayor a $0.");
      return;
    }
    if (promo >= basePrice) {
      setOfferModalError(
        `El precio promocional debe ser menor al precio regular (${formatPrice(basePrice)}).`
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

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 max-w-screen-xl mx-auto w-full gap-6">
      {/* Top Operational Header */}
      <section className="rounded-2xl border border-white/[0.08] bg-surface-card p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold">
              <Store className="size-3.5" aria-hidden="true" />
              <span>Sucursal {activeBranch.name}</span>
            </div>

            <h1 className="font-headline text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              Gestión de Precios y Ofertas por Sucursal
            </h1>

            <p className="text-xs sm:text-sm text-brand-muted max-w-2xl leading-relaxed">
              Configurá el precio por kilogramo o por unidad, habilitá productos en el
              mostrador online y activá ofertas exclusivas para{" "}
              <strong className="text-white">Sucursal {activeBranch.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/catalogo/${activeBranch.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-brand-gold/40 bg-brand-gold/15 hover:bg-brand-gold/25 text-brand-gold font-headline font-bold text-xs sm:text-sm px-4 py-2.5 transition-all active:scale-95"
            >
              <span>Ver Tienda {activeBranch.name}</span>
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Status Counter Tabs */}
        <div
          role="tablist"
          aria-label="Filtrar por estado en la sucursal"
          className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-5 border-t border-white/[0.06]"
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
                  "flex min-h-[48px] items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-brand-gold bg-brand-gold/15 text-white shadow-sm"
                    : "border-white/[0.06] bg-[#111215] text-zinc-400 hover:border-white/15 hover:text-white"
                )}
              >
                <span className="text-xs font-semibold truncate pr-2">{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                    isSelected
                      ? "bg-brand-gold text-stone-950"
                      : "bg-white/[0.06] text-zinc-300"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Feedback Toast / Banner */}
      {feedbackBanner && (
        <div
          role="status"
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium animate-in fade-in-50 duration-150",
            feedbackBanner.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/40 bg-red-500/10 text-red-200"
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === "success" ? (
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="size-4 text-red-400 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            aria-label="Cerrar notificación"
            className="p-1 text-white/60 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto por nombre o código..."
            aria-label="Buscar producto en la sucursal"
            className="min-h-[44px] w-full rounded-xl border border-white/[0.08] bg-surface-card pl-10 pr-9 text-sm text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-zinc-400">
          Mostrando <strong className="text-white">{items.length}</strong> de{" "}
          <strong className="text-white">{productsQuery.data?.total ?? 0}</strong> productos
        </div>
      </section>

      {/* Products List */}
      <section className="space-y-3">
        {productsQuery.isPending ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-surface-card py-16 text-zinc-400 gap-3">
            <Loader2 className="size-6 animate-spin text-brand-gold" />
            <span className="text-sm">Cargando productos de la sucursal...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-surface-card py-14 px-4 text-center gap-3">
            <Package className="size-10 text-brand-gold/60" />
            <h2 className="font-headline text-base font-bold text-white">
              No encontramos productos con este filtro
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm">
              Probá cambiando de pestaña o limpiando el término de búsqueda.
            </p>
            {(activeTab !== "ALL" || searchTerm) && (
              <Button
                variant="outline"
                className="min-h-[44px] mt-1"
                onClick={() => {
                  setActiveTab("ALL");
                  setSearchTerm("");
                }}
              >
                Restablecer filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const unitSuffix = item.saleUnit === "WEIGHT" ? "/ kg" : "/ un.";
              const unitBadge =
                item.saleUnit === "WEIGHT"
                  ? "Granel · Precio por 1 kg"
                  : "Venta por unidad";
              const draftValue = getDraftPrice(item);
              const isConfigured = item.price !== null && item.price > 0;

              return (
                <article
                  key={item.productId}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-surface-card p-4 sm:p-5 transition-colors hover:border-white/[0.15]"
                >
                  {/* Left: Product Identity & Status Badges */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <div className="size-14 sm:size-16 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[#111215]">
                      <ProductImage
                        src={item.imageUrls[0] ?? null}
                        alt={item.name}
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold">
                          {item.categoryName}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="text-[11px] font-medium text-zinc-400">
                          {unitBadge}
                        </span>

                        {item.status === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                            <Check className="size-3" /> En tienda
                          </span>
                        )}
                        {item.status === "INACTIVE" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                            <PauseCircle className="size-3" /> Pausado
                          </span>
                        )}
                        {item.status === "UNCONFIGURED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/20 border border-zinc-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                            Sin precio
                          </span>
                        )}
                        {item.isOnSale && item.promotionalPrice !== null && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/20 border border-brand-gold/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                            <Sparkles className="size-3" /> Oferta:{" "}
                            {formatPrice(item.promotionalPrice)} {unitSuffix}
                          </span>
                        )}
                      </div>

                      <h2 className="font-headline text-sm sm:text-base font-bold text-white truncate">
                        {item.name}
                      </h2>

                      {item.description && (
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Price Input, Save, Offer Trigger & Availability Switch */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-3 border-t border-white/[0.06] lg:pt-0 lg:border-t-0 shrink-0">
                    {/* Price Input Group */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center">
                        <span className="pointer-events-none absolute left-3 text-xs font-bold text-zinc-400">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          aria-label={`Precio de ${item.name}`}
                          value={draftValue}
                          onChange={(e) =>
                            setDraftPrices((prev) => ({
                              ...prev,
                              [item.productId]: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="min-h-[44px] w-36 rounded-xl border border-white/[0.1] bg-[#111215] pl-7 pr-11 text-sm font-semibold tabular-nums text-white focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                        />
                        <span className="pointer-events-none absolute right-3 text-[11px] font-medium text-zinc-400">
                          {unitSuffix}
                        </span>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleSavePrice(item)}
                        disabled={upsertMutation.isPending}
                        className="min-h-[44px] px-3.5 text-xs font-semibold"
                      >
                        Guardar precio
                      </Button>
                    </div>

                    {/* Offer & Availability Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!isConfigured}
                        onClick={() => openOfferModal(item)}
                        title={
                          isConfigured
                            ? "Configurar oferta para este producto"
                            : "Guardá primero un precio base para habilitar ofertas"
                        }
                        className={cn(
                          "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                          item.isOnSale
                            ? "border-brand-gold bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25"
                            : "border-white/[0.1] bg-[#111215] text-zinc-300 hover:border-brand-gold/50 hover:text-white"
                        )}
                      >
                        <Tag className="size-3.5" aria-hidden="true" />
                        <span>{item.isOnSale ? "Editar oferta" : "Oferta"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSavePrice(item, !item.isAvailable)}
                        disabled={upsertMutation.isPending}
                        className={cn(
                          "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition-all cursor-pointer",
                          item.isAvailable
                            ? "border-white/[0.1] bg-[#111215] text-zinc-300 hover:border-amber-500/40 hover:text-amber-300"
                            : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                        )}
                      >
                        {item.isAvailable ? "Pausar" : "Activar"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <Button
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
      {offerModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setOfferModalItem(null)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-white/[0.1] bg-surface-card p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-gold">
                  <Percent className="size-3.5" /> Promoción de Sucursal
                </span>
                <h2
                  id="offer-modal-title"
                  className="font-headline text-lg font-bold text-white mt-0.5"
                >
                  {offerModalItem.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOfferModalItem(null)}
                aria-label="Cerrar modal de oferta"
                className="flex size-9 items-center justify-center rounded-full text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#111215] p-3.5 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Precio regular ({offerModalItem.saleUnit === "WEIGHT" ? "por 1 kg" : "por unidad"}):
              </span>
              <span className="font-headline text-sm font-bold text-white">
                {formatPrice(offerModalItem.price ?? 0)}{" "}
                {offerModalItem.saleUnit === "WEIGHT" ? "/ kg" : "/ un."}
              </span>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="promoPriceField"
                className="block text-xs font-semibold text-zinc-200"
              >
                Precio promocional de oferta ({offerModalItem.saleUnit === "WEIGHT" ? "$ / kg" : "$ / un."})
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3.5 text-sm font-bold text-brand-gold">
                  $
                </span>
                <input
                  id="promoPriceField"
                  type="number"
                  min="1"
                  step="10"
                  value={promoPriceInput}
                  onChange={(e) => {
                    setPromoPriceInput(e.target.value);
                    setOfferModalError(null);
                  }}
                  placeholder="Ej: 12500"
                  className="min-h-[46px] w-full rounded-xl border border-white/[0.12] bg-[#111215] pl-8 pr-16 text-sm font-bold text-white focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                />
                {offerModalItem.price &&
                  Number(promoPriceInput) > 0 &&
                  Number(promoPriceInput) < offerModalItem.price && (
                    <span className="absolute right-3 rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-bold text-brand-gold">
                      -
                      {Math.round(
                        ((offerModalItem.price - Number(promoPriceInput)) /
                          offerModalItem.price) *
                          100
                      )}
                      %
                    </span>
                  )}
              </div>
              <p className="text-[11px] text-zinc-400">
                En el catálogo público se mostrará el precio regular tachado junto con la insignia de{" "}
                <strong className="text-brand-gold">Oferta</strong>.
              </p>
            </div>

            {offerModalError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200"
              >
                <AlertCircle className="size-4 shrink-0 text-red-400" />
                <span>{offerModalError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              {offerModalItem.isOnSale && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveOffer}
                  disabled={offerMutation.isPending}
                  className="w-full sm:w-auto min-h-[44px] border-red-500/40 text-red-300 hover:bg-red-500/15"
                >
                  Quitar oferta
                </Button>
              )}

              <Button
                type="button"
                onClick={handleActivateOffer}
                disabled={offerMutation.isPending}
                className="w-full sm:w-auto min-h-[44px] bg-brand-gold text-stone-950 hover:bg-brand-gold-hover font-bold"
              >
                {offerModalItem.isOnSale ? "Guardar oferta" : "Activar oferta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
