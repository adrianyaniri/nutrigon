import { MapPin, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButton } from "@/components/atoms/icon-button";
import { SearchInput } from "@/components/molecules/search-input";

export interface CatalogHeaderProps {
  branchSlug?: string;
  branchName?: string;
  search: string;
  onSearchChange: (value: string) => void;
  cartItemCount: number;
}

/**
 * Editorial, clean header with prominent centered branding.
 * Eliminates branch-switching distractions to keep the customer focused
 * on their scanned branch location.
 */
export function CatalogHeader({
  branchSlug,
  branchName,
  search,
  onSearchChange,
  cartItemCount,
}: CatalogHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center justify-between gap-y-3 px-4 py-3 md:flex-nowrap md:gap-x-6 md:px-6">
        {/* Brand with Logo */}
        <div className="flex items-center gap-3">
          <Link
            to={branchSlug ? `/catalogo/${branchSlug}` : "/catalogo"}
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 group"
          >
            <span className="relative flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/60 shadow-md bg-brand-surface transition-transform group-hover:scale-105">
              <img src="/Logo.jpeg" alt="Nutrigon" className="size-full object-cover" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-white">
                Nutrigon
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-brand-gold uppercase">
                Dietética &amp; Cerealera
              </span>
            </div>
          </Link>

          {/* Discreet Local Store Pin (No switcher, avoids cross-branch confusion) */}
          {branchName && (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-brand-surface/60 px-3 py-1 text-xs text-zinc-300 ml-2">
              <MapPin className="size-3 text-brand-gold shrink-0" aria-hidden="true" />
              <span className="font-medium">Sucursal {branchName}</span>
            </div>
          )}
        </div>

        {/* Mobile Local Store Pin */}
        {branchName && (
          <div className="sm:hidden flex items-center gap-1 text-[11px] text-zinc-400">
            <MapPin className="size-3 text-brand-gold shrink-0" aria-hidden="true" />
            <span>Sucursal {branchName}</span>
          </div>
        )}

        {/* Right Section: Search & Cart */}
        <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            className="w-full sm:w-64 md:w-80"
          />

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
