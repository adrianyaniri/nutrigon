import { Clock, ExternalLink, Instagram, MapPin, Store } from "lucide-react";
import { Link } from "react-router-dom";
import type { CatalogBranch } from "../types";

export interface CatalogFooterProps {
  currentBranch?: CatalogBranch | null;
  branches: readonly CatalogBranch[];
}

interface BranchLocationMeta {
  address: string;
  hours: string;
  lat: number;
  lon: number;
}

const BRANCH_LOCATIONS: Record<string, BranchLocationMeta> = {
  centro: {
    address: "San Martín 450 (Centro)",
    hours: "Lun a Vie 8:30 a 20:30 · Sáb 9:00 a 14:00",
    lat: -31.4167,
    lon: -64.1833,
  },
  norte: {
    address: "Av. Libertad 1200",
    hours: "Lun a Vie 9:00 a 20:00 · Sáb 9:00 a 13:30",
    lat: -31.39,
    lon: -64.195,
  },
  sur: {
    address: "Belgrano 890",
    hours: "Lun a Vie 8:30 a 20:00 · Sáb 9:00 a 13:30",
    lat: -31.435,
    lon: -64.188,
  },
};

/**
 * Editorial footer featuring the current branch, interactive location map,
 * creative Instagram community card, and clean zero-clutter layout.
 */
export function CatalogFooter({ currentBranch, branches }: CatalogFooterProps) {
  const branchKey = currentBranch?.slug ?? "centro";
  const locationMeta = BRANCH_LOCATIONS[branchKey] ?? BRANCH_LOCATIONS.centro!;
  const otherBranches = branches.filter((b) => b.slug !== currentBranch?.slug);

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${locationMeta.lon - 0.006},${locationMeta.lat - 0.004},${locationMeta.lon + 0.006},${locationMeta.lat + 0.004}&layer=mapnik&marker=${locationMeta.lat},${locationMeta.lon}`;
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${locationMeta.address}, Argentina`)}`;

  return (
    <footer className="mt-16 border-t border-brand-border/80 bg-brand-surface/95 pt-12 pb-12 text-zinc-400">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Brand & Current Store Details (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            {/* Brand Signature */}
            <div className="flex items-center gap-3">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/60 bg-brand-card shadow-md">
                <img src="/Logo.jpeg" alt="Nutrigon" className="size-full object-cover" />
              </span>
              <div>
                <span className="font-headline text-xl font-bold tracking-tight text-white block">
                  Nutrigon
                </span>
                <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">
                  Dietética &amp; Cerealera
                </span>
              </div>
            </div>

            {/* Current Branch Information Card */}
            <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-headline text-base font-bold text-white flex items-center gap-2">
                  <Store className="size-4 text-brand-gold" />
                  Sucursal {currentBranch ? currentBranch.name : "Centro"}
                </span>
                <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-gold">
                  Tu local
                </span>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-brand-gold shrink-0 mt-0.5" />
                  <span>{locationMeta.address}</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-400">
                  <Clock className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{locationMeta.hours}</span>
                </div>
              </div>
            </div>

            {/* Creative Instagram Community Card */}
            <div className="rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-card to-brand-gold/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-gold">
                  <Instagram className="size-4" />
                  <span>Comunidad Nutrigon</span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  Instagram
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Recetas saludables, nuevos ingresos de temporada y promociones exclusivas.
              </p>
              <div>
                <a
                  href="https://instagram.com/nutrigon.dietetica"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-surface border border-brand-gold/40 px-3.5 py-2 text-xs font-semibold text-white hover:border-brand-gold hover:text-brand-gold transition-colors"
                >
                  <Instagram className="size-3.5 text-brand-gold" />
                  <span>@nutrigon.dietetica</span>
                  <ExternalLink className="size-3 ml-1 text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* Other Branches (Subtle & clean) */}
            {otherBranches.length > 0 && (
              <div className="text-xs text-zinc-400 pt-1">
                <span>Otras sucursales: </span>
                {otherBranches.map((b, idx) => (
                  <span key={b.slug}>
                    <Link
                      to={`/catalogo/${b.slug}`}
                      className="text-brand-gold hover:underline font-medium"
                    >
                      Sucursal {b.name}
                    </Link>
                    {idx < otherBranches.length - 1 && " · "}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Location Map (7 cols) */}
          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <MapPin className="size-4 text-brand-gold" />
                <span>Ubicación de Sucursal {currentBranch ? currentBranch.name : "Centro"}</span>
              </div>
              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-brand-gold hover:underline flex items-center gap-1"
              >
                Abrir en Maps <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-2xl border border-brand-border bg-brand-card shadow-md">
              <iframe
                title={`Mapa interactivo de Sucursal ${currentBranch ? currentBranch.name : "Centro"}`}
                src={mapSrc}
                className="size-full border-0 grayscale contrast-125 opacity-90 hover:opacity-100 transition-opacity"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            </div>
            <p className="text-[11px] text-zinc-400">
              * Mapa interactivo para llegar a nuestro local. Tu pedido por WhatsApp se retira o despacha desde este punto de venta.
            </p>
          </div>
        </div>

        {/* Minimal Copyright Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-brand-border/60 pt-6 text-xs text-zinc-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Nutrigon Dietética &amp; Cerealera. Todos los derechos reservados.</p>
          <p className="text-zinc-400 text-[11px]">
            Alimentación consciente y venta fraccionada a tu medida.
          </p>
        </div>
      </div>
    </footer>
  );
}
