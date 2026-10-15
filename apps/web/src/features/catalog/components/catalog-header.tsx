import { MapPin, Menu, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButton } from "@/components/atoms/icon-button";

export interface CatalogHeaderProps {
  branchSlug?: string;
  branchName?: string;
  cartItemCount: number;
  onOpenCategories?: () => void;
}

/**
 * Editorial header with perfectly centered branding.
 * Left: Mobile category drawer toggle / Desktop branch indicator.
 * Center: Nutrigon Logo and brand identity.
 * Right: Cart button.
 */
export function CatalogHeader({
  branchSlug,
  branchName,
  cartItemCount,
  onOpenCategories,
}: CatalogHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-4 md:px-6">
        {/* Left Column: Mobile Menu Toggle / Desktop Branch Location */}
        <div className="flex w-1/4 items-center justify-start">
          {onOpenCategories && (
            <button
              type="button"
              onClick={onOpenCategories}
              aria-label="Abrir menú de categorías"
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/80 bg-brand-surface/80 px-3 py-2 text-xs font-semibold text-white hover:border-brand-gold hover:text-brand-gold transition-colors md:hidden shadow-2xs"
            >
              <Menu className="size-4 text-brand-gold" aria-hidden="true" />
              <span className="hidden sm:inline">Categorías</span>
            </button>
          )}

          {branchName && (
            <div className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-brand-surface/60 px-3 py-1 text-xs text-zinc-300">
              <MapPin className="size-3 text-brand-gold shrink-0" aria-hidden="true" />
              <span className="font-medium">Sucursal {branchName}</span>
            </div>
          )}
        </div>

        {/* Center Column: Prominent Centered Brand Logo */}
        <div className="flex flex-1 items-center justify-center">
          <Link
            to={branchSlug ? `/catalogo/${branchSlug}` : "/catalogo"}
            className="flex items-center gap-2.5 sm:gap-3 group"
          >
            <span className="relative flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/60 shadow-md bg-brand-surface transition-transform group-hover:scale-105">
              <img src="/Logo.jpeg" alt="Nutrigon" className="size-full object-cover" />
            </span>
            <div className="flex flex-col leading-tight text-center sm:text-left">
              <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-white">
                Nutrigon
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-brand-gold uppercase">
                Dietética &amp; Cerealera
              </span>
            </div>
          </Link>
        </div>

        {/* Right Column: Cart Button */}
        <div className="flex w-1/4 items-center justify-end">
          <IconButton
            aria-label={
              cartItemCount === 0
                ? "Mi pedido, vacío"
                : `Mi pedido, ${cartItemCount} ${cartItemCount === 1 ? "producto" : "productos"}`
            }
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartItemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
              >
                {cartItemCount}
              </span>
            )}
          </IconButton>
        </div>
      </div>
    </header>
  );
}
