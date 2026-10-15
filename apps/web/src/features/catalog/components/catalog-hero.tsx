import { MapPin, MessageCircle, Scale, Sparkles } from "lucide-react";

interface CatalogHeroProps {
  branchName?: string;
}

/**
 * Brand Hero / Welcome Banner:
 * Establishes brand personality, communicates value proposition (bulk natural foods),
 * and reinforces multi-branch + direct WhatsApp ordering.
 */
export function CatalogHero({ branchName }: CatalogHeroProps) {
  return (
    <section
      aria-label="Presentación de Nutrigon"
      className="relative mb-6 overflow-hidden rounded-2xl border border-brand-border/80 bg-gradient-to-br from-brand-surface via-brand-card to-[#121316] p-5 shadow-lg sm:p-7 md:mb-8"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-gold/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-brand-gold-hover/5 blur-3xl"
      />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs font-semibold text-brand-gold">
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Alimentación Consciente &amp; Cerealera</span>
          </div>

          <h2 className="font-headline text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
            Comé rico, sano y a tu medida.
          </h2>

          <p className="text-sm text-zinc-300 sm:text-base">
            Frutos secos premium, harinas orgánicas, legumbres y productos sin TACC fraccionados al peso exacto que necesitás.
            {branchName && (
              <span className="mt-1 block font-medium text-brand-gold">
                Precios y disponibilidad para Sucursal {branchName}.
              </span>
            )}
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 md:flex-col md:items-end">
          <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border/60 bg-black/40 px-3.5 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xs">
            <Scale className="size-4 text-brand-gold shrink-0" aria-hidden="true" />
            <span>Granel desde 100 g</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border/60 bg-black/40 px-3.5 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xs">
            <MapPin className="size-4 text-brand-gold shrink-0" aria-hidden="true" />
            <span>3 Puntos de venta</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-brand-border/60 bg-black/40 px-3.5 py-2 text-xs font-medium text-emerald-400 backdrop-blur-xs">
            <MessageCircle className="size-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>Pedido directo a WhatsApp</span>
          </div>
        </div>
      </div>
    </section>
  );
}
