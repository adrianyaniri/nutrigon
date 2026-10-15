import { Instagram, MapPin, MessageSquare, ShieldCheck } from "lucide-react";
import type { CatalogBranch } from "../types";

interface CatalogFooterProps {
  branches: readonly CatalogBranch[];
}

export function CatalogFooter({ branches }: CatalogFooterProps) {
  return (
    <footer className="mt-16 border-t border-brand-border/80 bg-brand-surface/90 pt-12 pb-16 text-zinc-400">
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4 md:col-span-1">
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
            <p className="text-xs leading-relaxed text-zinc-400">
              Alimentos conscientes, cerealera a granel, frutos secos seleccionados y productos especiales para una vida saludable.
            </p>
          </div>

          {/* Column 2: Social Media & Community */}
          <div className="space-y-4">
            <h3 className="font-headline text-sm font-semibold uppercase tracking-wider text-white">
              Comunidad &amp; Redes
            </h3>
            <p className="text-xs text-zinc-400">
              Seguinos en Instagram para recetas, novedades de ingresos y ofertas especiales:
            </p>
            <a
              href="https://instagram.com/nutrigon.dietetica"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-border/70 bg-brand-card px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand-gold hover:text-brand-gold"
            >
              <Instagram className="size-5 text-pink-500" aria-hidden="true" />
              <span>@nutrigon.dietetica</span>
            </a>
          </div>

          {/* Column 3: Multi-Branch & WhatsApp Note */}
          <div className="space-y-4 sm:col-span-2">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-gold" aria-hidden="true" />
              <h3 className="font-headline text-sm font-semibold uppercase tracking-wider text-white">
                Nuestras Sucursales
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {branches.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-brand-border/50 bg-brand-card/60 p-3"
                >
                  <span className="font-semibold text-xs text-white block">
                    Sucursal {b.name}
                  </span>
                  <span className="text-[11px] text-brand-gold block mt-0.5">
                    Stock &amp; Precios propios
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-1 block">
                    Atención personalizada
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/5 p-3 text-xs leading-relaxed text-zinc-300">
              <div className="flex items-center gap-2 text-brand-gold font-medium mb-1">
                <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
                <span>Líneas de WhatsApp independientes</span>
              </div>
              Cada sucursal gestiona su propio inventario y pedidos. Al seleccionar tu sucursal en el encabezado, tu pedido se derivará automáticamente al WhatsApp correspondiente a esa tienda.
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-brand-border/60 pt-6 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Nutrigon Dietética. Todos los derechos reservados.</p>
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="size-3.5 text-brand-gold" aria-hidden="true" />
            <span>Precios y stock sujetos a disponibilidad de cada sucursal.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
