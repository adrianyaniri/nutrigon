import { useEffect, useState } from "react";
import {
  ArrowRight,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  QrCode,
  Shield,
  Smartphone,
  Store,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CatalogFooter } from "../components/catalog-footer";
import { useBranches } from "../hooks/use-catalog-queries";

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
    description:
      "Nuestra sucursal central con la mayor variedad de harinas, frutos secos y especias sueltas.",
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nutrigon:last-branch");
      if (saved) setLastBranchSlug(saved);
    } catch {
      // Ignore localStorage access failures
    }
  }, []);

  const lastBranch = branches.find((b) => b.slug === lastBranchSlug);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Top Simple Header with Admin Button */}
      <header className="border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="relative flex size-11 md:size-12 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/50 shadow-md bg-brand-surface">
              <img
                src="/Logo.jpeg"
                alt=""
                width="48"
                height="48"
                loading="eager"
                decoding="async"
                className="size-full object-cover"
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-headline text-lg md:text-xl font-bold tracking-tight text-foreground">
                Nutrigon
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-brand-gold uppercase">
                Dietética &amp; Cerealera
              </span>
            </span>
          </Link>

          <Link
            to="/admin"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:border-brand-gold hover:text-foreground transition-colors"
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
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold text-amber-800 dark:text-brand-gold mb-4">
            <QrCode className="size-3.5" aria-hidden="true" />
            Acceso Exclusivo por Código QR
          </div>

          <h1 className="font-headline text-2xl font-bold tracking-tight sm:text-4xl text-foreground">
            Escaneá el código QR en tu sucursal
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Cada punto de venta de Nutrigon cuenta con catálogo, stock y precios propios.
            Escaneá con la cámara de tu celular el código QR del mostrador en tu sucursal para ver los precios y armar tu pedido por WhatsApp.
          </p>

          {/* 3-Step QR Instructions */}
          <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-brand-gold">
                <Store className="size-4 shrink-0" aria-hidden="true" />
                <span>1. En tu sucursal</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Buscá el cartel con el código QR en el mostrador del local.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-brand-gold">
                <Smartphone className="size-4 shrink-0" aria-hidden="true" />
                <span>2. Escaneá el QR</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Apuntá con la cámara de tu celular para abrir el catálogo del local.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-brand-gold">
                <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
                <span>3. Armá tu pedido</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Elegí tus productos por peso o unidad y envialo por WhatsApp.
              </p>
            </div>
          </div>

          {lastBranch && (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
              <span className="text-muted-foreground">Última sucursal escaneada:</span>
              <span className="font-semibold text-primary">Sucursal {lastBranch.name}</span>
              <Button
                size="sm"
                className="ml-2 min-h-[44px] px-3.5 text-xs font-semibold"
                onClick={() => navigate(`/catalogo/${lastBranch.slug}`)}
              >
                Volver al catálogo <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Institutional Branch Directory */}
        <section aria-label="Nuestras sucursales" className="mt-10 w-full max-w-4xl">
          <h2 className="mb-4 text-center font-headline text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Nuestras Sucursales · Ubicación y Horarios
          </h2>

          {branchesQuery.isPending ? (
            <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse motion-reduce:animate-none min-h-[240px]"
                >
                  <div className="space-y-3">
                    <div className="size-10 rounded-xl bg-muted" />
                    <div className="h-5 w-32 rounded bg-muted" />
                    <div className="h-3.5 w-48 rounded bg-muted" />
                    <div className="h-12 w-full rounded bg-muted/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {branches.map((branch) => {
                const details = BRANCH_DETAILS[branch.slug] ?? {
                  address: branch.address ?? `Sucursal ${branch.name}`,
                  hours: "Lunes a Viernes 8:30 a 20:00 · Sábados 9:00 a 13:30",
                  description: "Productos seleccionados de dietética y alimentos naturales.",
                };
                const displayAddress = branch.address ?? details.address;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${displayAddress}, Buenos Aires, Argentina`
                )}`;
                const cleanWhatsapp = branch.whatsappNumber?.replace(/\D/g, "");

                return (
                  <div
                    key={branch.slug}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand-gold/40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
                          <Store className="size-5" aria-hidden="true" />
                        </span>
                        {details.badge && (
                          <span className="rounded-full bg-brand-gold/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-brand-gold">
                            {details.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-headline text-lg font-bold text-foreground">
                          Sucursal {branch.name}
                        </h3>
                        <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0 text-brand-gold mt-0.5" aria-hidden="true" />
                          <span>{displayAddress}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {details.description}
                      </p>

                      <div className="flex items-start gap-1.5 pt-2 border-t border-border text-[11px] text-muted-foreground">
                        <Clock className="size-3 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{details.hours}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-border/60">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-brand-surface/50 px-3 py-2 text-xs font-semibold text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors"
                      >
                        <MapPin className="size-3.5 text-brand-gold shrink-0" aria-hidden="true" />
                        <span>Cómo llegar</span>
                        <ExternalLink className="size-3 opacity-60 shrink-0" aria-hidden="true" />
                      </a>

                      {cleanWhatsapp && (
                        <a
                          href={`https://wa.me/${cleanWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Consultar por WhatsApp a Sucursal ${branch.name}`}
                          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <MessageCircle className="size-3.5 shrink-0" aria-hidden="true" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <CatalogFooter branches={branches} />
    </div>
  );
}

