import { ExternalLink, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
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
  return (
    <footer className="mt-16 border-t border-brand-border/80 bg-brand-surface/95 py-12 text-muted-foreground">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
        {/* Brand Presentation & Social */}
        <div className="flex flex-col items-center justify-between gap-6 pb-8 border-b border-brand-border/60 text-center md:flex-row md:text-left">
          <div className="flex flex-col items-center md:items-start gap-3 max-w-sm">
            <div className="flex items-center gap-3.5">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/70 bg-brand-card shadow-lg">
                <img
                  src="/Logo.jpeg"
                  alt=""
                  width="48"
                  height="48"
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </span>
              <div>
                <span className="font-headline text-xl font-bold tracking-tight text-foreground block">
                  Nutrigon
                </span>
                <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider block">
                  Dietética &amp; Cerealera
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Alimentación consciente, frutos secos, semillas y fraccionamiento a medida.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <span className="font-headline text-xs font-bold text-foreground uppercase tracking-wider">
              Seguinos en redes
            </span>
            <a
              href="https://www.instagram.com/nutri.go/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram @nutri.go"
              className="inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-brand-gold/40 bg-brand-card/80 px-4 py-2 text-xs font-semibold text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors shadow-2xs"
            >
              <Instagram className="size-4 text-brand-gold" aria-hidden="true" />
              <span>@nutri.go</span>
              <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* All Branches Section */}
        {branches.length > 0 && (
          <div className="py-8">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-center sm:text-left">
              <h3 className="font-headline text-xs font-bold uppercase tracking-wider text-foreground">
                Nuestras Sucursales
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Ubicación y contacto directo de cada punto de venta
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((b) => {
                const mapsQuery = b.address
                  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.address}, Argentina`)}`
                  : null;
                const isCurrent = currentBranch?.slug === b.slug;

                return (
                  <div
                    key={b.slug}
                    className={`flex flex-col justify-between gap-3 rounded-2xl border p-4.5 transition-all ${
                      isCurrent
                        ? "border-brand-gold/60 bg-brand-card shadow-sm"
                        : "border-border/60 bg-brand-surface/60"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-headline text-sm font-bold text-foreground">
                          Sucursal {b.name}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-gold-text">
                            Actual
                          </span>
                        )}
                      </div>

                      {b.address && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin
                            className="size-3.5 text-brand-gold-text shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{b.address}</span>
                        </div>
                      )}

                      {mapsQuery && (
                        <div>
                          <a
                            href={mapsQuery}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-gold-text hover:underline"
                          >
                            <span>Ver en Google Maps</span>
                            <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/40 space-y-1 text-[11px] text-muted-foreground">
                      {b.whatsappNumber && (
                        <div className="flex items-center gap-1.5">
                          <MessageCircle
                            className="size-3.5 shrink-0 text-status-success"
                            aria-hidden="true"
                          />
                          <a
                            href={`https://wa.me/${b.whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground hover:underline transition-colors"
                          >
                            WhatsApp: +{b.whatsappNumber}
                          </a>
                        </div>
                      )}

                      {b.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone
                            className="size-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          <span>Tel: {b.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Copyright */}
        <div className="border-t border-brand-border/60 pt-6 text-center sm:text-left text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Nutrigon Dietética. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
