import { useEffect, useRef, useState } from "react";
import { MapPin, Menu, QrCode, Shield, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { IconButton } from "@/components/atoms/icon-button";
import { cn } from "@/lib/utils/cn";

export interface CatalogHeaderProps {
  branchSlug?: string;
  branchName?: string;
  cartItemCount: number;
  onOpenCategories?: () => void;
  onOpenCart?: () => void;
  onOpenQr?: () => void;
}

/**
 * Editorial header with perfectly centered branding.
 * Left: Mobile category drawer toggle & static read-only branch badge.
 * Center: Nutrigon Logo and brand identity.
 * Right: QR Share button, Admin Access & Cart button.
 */
export function CatalogHeader({
  branchSlug,
  branchName,
  cartItemCount,
  onOpenCategories,
  onOpenCart,
  onOpenQr,
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
      <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Left Column: Mobile Menu Toggle & Read-Only Branch Badge */}
        <div className="flex shrink-0 items-center justify-start gap-1.5 sm:gap-2">
          {onOpenCategories && (
            <button
              type="button"
              onClick={onOpenCategories}
              aria-label="Abrir menú de categorías"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-brand-surface/80 px-2.5 sm:px-3 text-xs font-semibold text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors md:hidden shadow-2xs shrink-0"
            >
              <Menu className="size-4 text-brand-gold-text" aria-hidden="true" />
              <span className="hidden sm:inline">Categorías</span>
            </button>
          )}

          {branchName && (
            <div
              aria-label={`Sucursal actual: ${branchName}`}
              className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-border/80 bg-brand-surface/70 px-2.5 sm:px-3 py-1.5 text-xs text-muted-foreground shadow-2xs"
            >
              <MapPin className="size-3.5 text-brand-gold-text shrink-0" aria-hidden="true" />
              <span className="font-medium text-foreground max-w-[80px] sm:max-w-none truncate">
                <span className="hidden sm:inline text-muted-foreground font-normal">Sucursal </span>
                {branchName}
              </span>
            </div>
          )}
        </div>

        {/* Center Column: Prominent Centered Brand Logo */}
        <div className="flex flex-1 items-center justify-center px-1 min-w-0">
          <Link
            to={branchSlug ? `/catalogo/${branchSlug}` : "/catalogo"}
            className="flex items-center gap-2 sm:gap-3 group max-w-full"
          >
            <span className="relative flex size-9 sm:size-11 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/60 shadow-md bg-brand-surface transition-transform group-hover:scale-105">
              <img
                src="/Logo.jpeg"
                alt="Nutrigon"
                width="44"
                height="44"
                loading="eager"
                decoding="async"
                className="size-full object-cover"
              />
            </span>
            <div className="flex flex-col leading-tight text-center sm:text-left min-w-0">
              <span className="font-headline text-base sm:text-xl font-bold tracking-tight text-foreground truncate">
                Nutrigon
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-brand-gold-text uppercase hidden xs:inline sm:inline truncate">
                Dietética &amp; Cerealera
              </span>
            </div>
          </Link>
        </div>

        {/* Right Column: QR Share, Admin Access & Cart Button */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          {onOpenQr && (
            <button
              type="button"
              onClick={onOpenQr}
              title={branchName ? `Ver y compartir QR de Sucursal ${branchName}` : "Ver código QR de la sucursal"}
              aria-label={branchName ? `Ver y compartir QR de Sucursal ${branchName}` : "Ver código QR de la sucursal"}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-brand-surface/60 px-2.5 text-xs font-semibold text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors shadow-2xs cursor-pointer"
            >
              <QrCode className="size-4 text-brand-gold-text shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">QR</span>
            </button>
          )}

          <Link
            to="/admin"
            title="Acceso al panel de administración"
            aria-label="Acceso al panel de administración"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/80 bg-brand-surface/60 text-muted-foreground hover:border-brand-gold hover:text-brand-gold transition-colors shadow-2xs"
          >
            <Shield className="size-4 text-brand-gold-text" aria-hidden="true" />
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
              "transition-transform duration-200 motion-reduce:transform-none",
              animateBadge && "scale-110"
            )}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {cartItemCount > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-xs transition-all duration-200 motion-reduce:transform-none",
                  animateBadge && "scale-125 bg-status-success text-white ring-2 ring-status-success/40"
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
