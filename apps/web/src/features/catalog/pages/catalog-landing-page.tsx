import { useEffect, useState } from "react";
import { ArrowRight, Clock, MapPin, QrCode, Shield, Store } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BranchQrModal } from "../components/branch-qr-modal";
import { CatalogFooter } from "../components/catalog-footer";
import { useBranches } from "../hooks/use-catalog-queries";
import type { CatalogBranch } from "../types";

const BRANCH_DETAILS: Record<
  string,
  { address: string; hours: string; description: string; badge?: string }
> = {
  origone: {
    address: "Tte. Manuel Origone 196, Villa Tesei",
    hours: "Lunes a Viernes 8:30 a 20:30 · Sábados 9:00 a 14:00",
    description:
      "Nuestra casa central en Villa Tesei con la mayor variedad de frutos secos, harinas y especias a granel.",
    badge: "Casa Central",
  },
  "pedro-diaz": {
    address: "Av. Gral. Pedro Díaz 1265, Hurlingham",
    hours: "Lunes a Viernes 9:00 a 20:00 · Sábados 9:00 a 13:30",
    description:
      "Sucursal Hurlingham, especializada en líneas completas Sin TACC, semillas y nutrición deportiva.",
  },
  "w-morris": {
    address: "Gdor. Vergara 4210, William C. Morris",
    hours: "Lunes a Viernes 8:30 a 20:00 · Sábados 9:00 a 13:30",
    description:
      "Sucursal William Morris, atención personalizada, amplia selección de cereales, legumbres y suplementos.",
  },
  centro: {
    address: "San Martín 450 (Centro)",
    hours: "Lunes a Viernes 8:30 a 20:30 · Sábados 9:00 a 14:00",
    description: "Nuestra sucursal central con la mayor variedad de harinas, frutos secos y especias sueltas.",
    badge: "Casa Central",
  },
  norte: {
    address: "Av. Libertad 1200",
    hours: "Lunes a Viernes 9:00 a 20:00 · Sábados 9:00 a 13:30",
    description: "Zona norte, especializada en líneas completas Sin TACC y nutrición deportiva.",
  },
  sur: {
    address: "Belgrano 890",
    hours: "Lunes a Viernes 8:30 a 20:00 · Sábados 9:00 a 13:30",
    description: "Zona sur, atención personalizada, amplia selección de semillas y suplementos.",
  },
};

export function CatalogLandingPage() {
  const navigate = useNavigate();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];
  const [lastBranchSlug, setLastBranchSlug] = useState<string | null>(null);
  const [selectedQrBranch, setSelectedQrBranch] = useState<CatalogBranch | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nutrigon:last-branch");
      if (saved) setLastBranchSlug(saved);
    } catch {
      // Ignore localStorage access failures
    }
  }, []);

  function handleSelectBranch(branch: CatalogBranch) {
    try {
      localStorage.setItem("nutrigon:last-branch", branch.slug);
    } catch {
      // Ignore
    }
    navigate(`/catalogo/${branch.slug}`);
  }

  const lastBranch = branches.find((b) => b.slug === lastBranchSlug);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Top Simple Header with Admin Button */}
      <header className="border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="relative flex size-11 md:size-12 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/50 shadow-md bg-brand-surface">
              <img src="/Logo.jpeg" alt="Nutrigon" className="size-full object-cover" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-headline text-lg md:text-xl font-bold tracking-tight text-white">
                Nutrigon
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-brand-gold uppercase">
                Dietética &amp; Cerealera
              </span>
            </span>
          </Link>

          <Link
            to="/admin"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-brand-gold hover:text-white transition-colors"
            title="Acceso al panel de administración"
          >
            <Shield className="size-3.5 text-brand-gold" aria-hidden="true" />
            <span>Acceso Gestión</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center justify-center px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold text-brand-gold mb-4">
            <Store className="size-3.5" />
            Catálogo Online &amp; Pedidos por WhatsApp
          </div>

          <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
            Elegí tu sucursal más cercana
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Cada sucursal cuenta con stock, precios propios y atención directa vía WhatsApp.
            Seleccioná tu punto de venta para ver el catálogo y armar tu pedido:
          </p>

          {lastBranch && (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
              <span className="text-muted-foreground">Última sucursal visitada:</span>
              <span className="font-semibold text-primary">Sucursal {lastBranch.name}</span>
              <Button
                size="sm"
                className="ml-2 min-h-[36px] text-xs font-semibold"
                onClick={() => handleSelectBranch(lastBranch)}
              >
                Continuar allí <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Branch Cards Grid */}
        {branchesQuery.isPending ? (
          <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse min-h-[280px]"
              >
                <div className="space-y-3">
                  <div className="size-10 rounded-xl bg-muted" />
                  <div className="h-5 w-32 rounded bg-muted" />
                  <div className="h-3.5 w-48 rounded bg-muted" />
                  <div className="h-12 w-full rounded bg-muted/60" />
                </div>
                <div className="h-11 w-full rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {branches.map((branch) => {
            const details = BRANCH_METADATA[branch.slug] ?? BRANCH_DETAILS[branch.slug] ?? {
              address: branch.address ?? `Sucursal ${branch.name}`,
              hours: "Lun a Vie 8:30 a 20:00 · Sáb 9:00 a 13:30",
              description: "Productos seleccionados de dietética y alimentos naturales.",
            };
            const extra = BRANCH_DETAILS[branch.slug];

            return (
              <div
                key={branch.slug}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand-gold/50 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                      <Store className="size-5" />
                    </span>
                    {extra?.badge && (
                      <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                        {extra.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-headline text-lg font-bold text-foreground">
                      Sucursal {branch.name}
                    </h2>
                    <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-brand-gold mt-0.5" />
                      <span>{branch.address ?? details.address}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground/90 leading-relaxed">
                    {extra?.description ?? "Variedad en frutos secos, harinas, semillas y productos sin TACC."}
                  </p>

                  <div className="flex items-start gap-1.5 pt-2 border-t border-border text-[11px] text-muted-foreground/80">
                    <Clock className="size-3 shrink-0 mt-0.5" />
                    <span>{details.hours}</span>
                  </div>
                </div>

                <div className="mt-6 pt-2 flex items-center gap-2">
                  <Button
                    className="flex-1 min-h-[44px] font-semibold"
                    onClick={() => handleSelectBranch(branch)}
                  >
                    Ver Catálogo {branch.name}
                    <ArrowRight className="size-4 ml-1.5" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedQrBranch(branch)}
                    title={`Ver código QR y cartel para mostrador de Sucursal ${branch.name}`}
                    className="min-h-[44px] px-3 border-border hover:border-brand-gold text-foreground hover:text-brand-gold shrink-0"
                  >
                    <QrCode className="size-4.5" aria-hidden="true" />
                    <span className="sr-only sm:not-sr-only sm:text-xs sm:ml-1 font-medium">QR</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </main>

      {selectedQrBranch && (
        <BranchQrModal
          isOpen={!!selectedQrBranch}
          onClose={() => setSelectedQrBranch(null)}
          branch={selectedQrBranch}
        />
      )}

      <CatalogFooter branches={branches} />
    </div>
  );
}

const BRANCH_METADATA: Record<string, { address: string; hours: string }> = {
  origone: {
    address: "Tte. Manuel Origone 196, Villa Tesei",
    hours: "Lun a Vie 8:30 a 20:30 · Sáb 9:00 a 14:00",
  },
  "pedro-diaz": {
    address: "Av. Gral. Pedro Díaz 1265, Hurlingham",
    hours: "Lun a Vie 9:00 a 20:00 · Sáb 9:00 a 13:30",
  },
  "w-morris": {
    address: "Gdor. Vergara 4210, William C. Morris",
    hours: "Lun a Vie 8:30 a 20:00 · Sáb 9:00 a 13:30",
  },
  centro: {
    address: "San Martín 450 (Centro)",
    hours: "Lun a Vie 8:30 a 20:30 · Sáb 9:00 a 14:00",
  },
  norte: {
    address: "Av. Libertad 1200",
    hours: "Lun a Vie 9:00 a 20:00 · Sáb 9:00 a 13:30",
  },
  sur: {
    address: "Belgrano 890",
    hours: "Lun a Vie 8:30 a 20:00 · Sáb 9:00 a 13:30",
  },
};

