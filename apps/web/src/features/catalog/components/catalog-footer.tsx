import { ExternalLink, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import type { CatalogBranch } from "../types";

export interface CatalogFooterProps {
  currentBranch?: CatalogBranch | null;
  branches: readonly CatalogBranch[];
}

/**
 * Clean, brand-forward footer with prominent logo, API-backed branch details,
 * lightweight Google Maps address link, minimal Instagram presence, and zero noise.
 */
export function CatalogFooter({ currentBranch, branches }: CatalogFooterProps) {
  const branch = currentBranch ?? branches[0];
  const otherBranches = branches.filter((b) => b.slug !== branch?.slug);

  const mapsQuery = branch?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.address}, Argentina`)}`
    : null;

  return (
    <footer className="mt-16 border-t border-brand-border/80 bg-brand-surface/95 py-12 text-zinc-400">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center gap-8 md:flex-row md:items-start md:justify-between md:text-left">
          {/* Brand Presentation - High Prominence */}
          <div className="flex flex-col items-center md:items-start gap-4 max-w-sm">
            <div className="flex items-center gap-3.5">
              <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/70 bg-brand-card shadow-lg">
                <img src="/Logo.jpeg" alt="Nutrigon" className="size-full object-cover" />
              </span>
              <div>
                <span className="font-headline text-2xl font-bold tracking-tight text-white block">
                  Nutrigon
                </span>
                <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider block">
                  Dietética &amp; Cerealera
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Alimentación consciente y fraccionamiento a medida.
            </p>
          </div>

          {/* Current Branch Information (Backed by API fields) */}
          {branch && (
            <div className="flex flex-col items-center md:items-start gap-2.5 text-xs text-zinc-300">
              <span className="font-headline text-sm font-bold text-white uppercase tracking-wider">
                Sucursal {branch.name}
              </span>

              {branch.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-brand-gold shrink-0" aria-hidden="true" />
                  <span>{branch.address}</span>
                  {mapsQuery && (
                    <a
                      href={mapsQuery}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 inline-flex items-center gap-0.5 text-brand-gold hover:underline font-semibold"
                    >
                      Maps <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )}

              {branch.phone && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Tel: {branch.phone}</span>
                </div>
              )}

              {branch.whatsappNumber && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <MessageCircle className="size-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>WhatsApp: +{branch.whatsappNumber}</span>
                </div>
              )}
            </div>
          )}

          {/* Social Network - Minimalist (Just Instagram logo + handle) */}
          <div className="flex flex-col items-center md:items-start gap-2.5">
            <span className="font-headline text-sm font-bold text-white uppercase tracking-wider">
              Seguinos
            </span>
            <a
              href="https://instagram.com/nutrigon.dietetica"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @nutrigon.dietetica"
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-brand-gold/40 bg-brand-card/80 px-4 py-2 text-xs font-semibold text-white hover:border-brand-gold hover:text-brand-gold transition-colors shadow-2xs"
            >
              <Instagram className="size-4 text-brand-gold" aria-hidden="true" />
              <span>@nutrigon.dietetica</span>
              <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Other Branches & Minimal Copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-brand-border/60 pt-6 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Nutrigon Dietética. Todos los derechos reservados.</p>

          {otherBranches.length > 0 && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <span>Otras sucursales:</span>
              {otherBranches.map((b, idx) => (
                <span key={b.slug}>
                  <Link
                    to={`/catalogo/${b.slug}`}
                    className="text-brand-gold hover:underline font-medium"
                  >
                    {b.name}
                  </Link>
                  {idx < otherBranches.length - 1 && " · "}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
