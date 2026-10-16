import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin, Menu, Shield, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButton } from "@/components/atoms/icon-button";
import { cn } from "@/lib/utils/cn";

export interface CatalogHeaderProps {
  branchSlug?: string;
  branchName?: string;
  cartItemCount: number;
  onOpenCategories?: () => void;
  onOpenCart?: () => void;
  onOpenBranchPicker?: () => void;
}

/**
 * Editorial header with perfectly centered branding.
 * Left: Mobile category drawer toggle / Responsive branch selector pill.
 * Center: Nutrigon Logo and brand identity.
 * Right: Cart button.
 */
export function CatalogHeader({
  branchSlug,
  branchName,
  cartItemCount,
  onOpenCategories,
  onOpenCart,
  onOpenBranchPicker,
}: CatalogHeaderProps) {
  const [animateBadge, setAnimateBadge] = useState(false);
  const prevCountRef = useRef(cartItemCount);

  useEffect(() => {
    if (cartItemCount > prevCountRef.current) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 500);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = cartItemCount;
  }, [cartItemCount]);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-4 md:px-6">
        {/* Left Column: Mobile Menu Toggle / Responsive Branch Location */}
        <div className="flex w-1/3 md:w-1/4 items-center justify-start gap-1.5 sm:gap-2">
          {onOpenCategories && (
            <button
              type="button"
              onClick={onOpenCategories}
              aria-label="Abrir menú de categorías"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-brand-surface/80 px-2.5 sm:px-3 text-xs font-semibold text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors md:hidden shadow-2xs shrink-0"
            >
              <Menu className="size-4 text-brand-gold" aria-hidden="true" />
              <span className="hidden sm:inline">Categorías</span>
            </button>
          )}

          {branchName &&
            (onOpenBranchPicker ? (
              <button
                type="button"
                onClick={onOpenBranchPicker}
                aria-label={`Sucursal actual: ${branchName}. Tocar para cambiar de sucursal`}
                className="flex min-h-[44px] items-center gap-1 sm:gap-1.5 rounded-full border border-border/80 bg-brand-surface/70 px-2.5 sm:px-3 text-xs text-muted-foreground hover:border-brand-gold hover:text-foreground transition-all group shadow-2xs"
              >
                <MapPin className="size-3.5 text-brand-gold shrink-0 transition-transform group-hover:scale-110" aria-hidden="true" />
                <span className="font-medium text-foreground max-w-[75px] sm:max-w-none truncate">
                  <span className="hidden sm:inline text-muted-foreground font-normal">Sucursal </span>
                  {branchName}
                </span>
                <ChevronDown className="size-3 text-brand-gold/80 shrink-0 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-brand-surface/60 px-3 py-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3 text-brand-gold shrink-0" aria-hidden="true" />
                <span className="font-medium text-foreground">Sucursal {branchName}</span>
              </div>
            ))}
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
              <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Nutrigon
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-brand-gold uppercase">
                Dietética &amp; Cerealera
              </span>
            </div>
          </Link>
        </div>

        {/* Right Column: Admin Access & Cart Button */}
        <div className="flex w-1/4 items-center justify-end gap-2">
          <Link
            to="/admin"
            title="Acceso al panel de administración"
            aria-label="Acceso al panel de administración"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/80 bg-brand-surface/60 text-muted-foreground hover:border-brand-gold hover:text-brand-gold transition-colors shadow-2xs"
          >
            <Shield className="size-4 text-brand-gold/80" aria-hidden="true" />
            <span className="sr-only">Acceso Administración</span>
          </Link>

          <IconButton
            onClick={onOpenCart}
            aria-label={
              cartItemCount === 0
                ? "Mi pedido, vacío"
                : `Mi pedido, ${cartItemCount} ${cartItemCount === 1 ? "producto" : "productos"}`
            }
            className={cn(
              "transition-transform duration-200",
              animateBadge && "scale-110"
            )}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartItemCount > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-xs transition-all duration-200",
                  animateBadge && "scale-125 bg-emerald-500 text-white ring-2 ring-emerald-400/40"
                )}
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
