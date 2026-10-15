import { useState } from "react";
import { ChevronDown, MapPin, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButton } from "@/components/atoms/icon-button";
import { SearchInput } from "@/components/molecules/search-input";
import { BranchPickerModal } from "./branch-picker-modal";
import type { CatalogBranch } from "../types";

export interface CatalogHeaderProps {
  branches: readonly CatalogBranch[];
  branchSlug: string;
  onBranchChange: (slug: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  cartItemCount: number;
}

/**
 * Responsive header with brand identity, compact branch selector trigger,
 * search input, and cart button.
 *
 * Mobile layout:
 * - Row 1: Brand & Logo + Branch Chip + Cart
 * - Row 2: Search input
 *
 * Desktop layout:
 * - [Brand & Logo] [Branch Chip] [Search Input (flex-1)] [Cart Button]
 */
export function CatalogHeader({
  branches,
  branchSlug,
  onBranchChange,
  search,
  onSearchChange,
  cartItemCount,
}: CatalogHeaderProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const currentBranch = branches.find((b) => b.slug === branchSlug);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-x-3 gap-y-2.5 px-4 py-3 md:flex-nowrap md:gap-x-6 md:px-6">
          {/* Brand Link */}
          <Link
            to={branchSlug ? `/catalogo/${branchSlug}` : "/catalogo"}
            className="flex items-center gap-2.5 sm:gap-3 shrink-0"
          >
            <span className="relative flex size-10 sm:size-11 md:size-12 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/50 shadow-md bg-brand-surface">
              <img src="/Logo.jpeg" alt="Nutrigon" className="size-full object-cover" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-headline text-base sm:text-lg md:text-xl font-bold tracking-tight text-white">
                Nutrigon
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-brand-gold uppercase">
                Dietética &amp; Cerealera
              </span>
            </span>
          </Link>

          {/* Compact Branch Selector Trigger */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isPickerOpen}
            aria-label={`Sucursal actual: ${currentBranch ? currentBranch.name : "Elegir"}. Cambiar sucursal`}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1.5 sm:px-3 text-xs font-medium text-foreground hover:border-brand-gold/50 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 shadow-2xs"
          >
            <MapPin className="size-3.5 text-brand-gold shrink-0" aria-hidden="true" />
            <span className="font-semibold text-white text-xs sm:text-sm">
              {currentBranch ? `Sucursal ${currentBranch.name}` : "Elegir sucursal"}
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">· Cambiar</span>
            <ChevronDown className="size-3 text-muted-foreground shrink-0" aria-hidden="true" />
          </button>

          {/* Cart Trigger */}
          <div className="ml-auto md:order-last">
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

          {/* Search Input (Full width on mobile, middle flex on desktop) */}
          <SearchInput
            value={search}
            onChange={onSearchChange}
            className="w-full md:w-auto md:max-w-md md:flex-1 md:ml-auto"
          />
        </div>
      </header>

      {/* Modal Dialog */}
      <BranchPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        branches={branches}
        currentBranchSlug={branchSlug}
        onSelectBranch={onBranchChange}
        cartItemCount={cartItemCount}
      />
    </>
  );
}
