import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButton } from "@/components/atoms/icon-button";
import { BranchSwitcher } from "@/components/molecules/branch-switcher";
import { SearchInput } from "@/components/molecules/search-input";
import type { CatalogBranch } from "../types";

interface CatalogHeaderProps {
  branches: readonly CatalogBranch[];
  branchSlug: string;
  onBranchChange: (slug: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  cartItemCount: number;
}

/**
 * Single DOM instance of every control; `order-*` utilities rearrange them:
 * mobile  -> [brand | cart] / search / branch
 * desktop -> [brand | branch | search | cart]
 */
export function CatalogHeader({
  branches,
  branchSlug,
  onBranchChange,
  search,
  onSearchChange,
  cartItemCount,
}: CatalogHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 md:flex-nowrap md:gap-x-6 md:px-6">
        <Link to="/catalogo" className="order-1 flex items-center gap-3 md:mr-3 shrink-0">
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

        <div className="order-2 ml-auto md:order-4 md:ml-0">
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

        <SearchInput
          value={search}
          onChange={onSearchChange}
          className="order-3 md:max-w-md md:flex-1"
        />

        <BranchSwitcher
          branches={branches}
          value={branchSlug}
          onChange={onBranchChange}
          className="order-4 md:order-2"
        />
      </div>
    </header>
  );
}
