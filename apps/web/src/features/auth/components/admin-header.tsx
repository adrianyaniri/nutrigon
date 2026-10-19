import { useEffect } from "react";
import { LogOut, MapPin, Store, ExternalLink, Tag, Package, Boxes, Building2 } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useBranches } from "@/features/catalog/hooks/use-catalog-queries";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "../context/auth-context";
import { Role } from "../types";

const FALLBACK_BRANCHES = [
  { id: "b-origone", slug: "origone", name: "Origone" },
  { id: "b-pedrodiaz", slug: "pedro-diaz", name: "Pedro Díaz" },
  { id: "b-wmorris", slug: "w-morris", name: "William Morris" },
] as const;

export function AdminHeader() {
  const { user, logout, selectedBranchSlug, setSelectedBranchSlug } = useAuth();
  const navigate = useNavigate();
  const branchesQuery = useBranches();
  const branches =
    branchesQuery.data && branchesQuery.data.length > 0
      ? branchesQuery.data
      : FALLBACK_BRANCHES;

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;

  useEffect(() => {
    if (!branches || branches.length === 0) return;

    if (!isGeneralAdmin && user?.branchId) {
      const assigned = branches.find((b) => b.id === user.branchId);
      if (assigned && assigned.slug !== selectedBranchSlug) {
        setSelectedBranchSlug(assigned.slug);
        return;
      }
    }

    const exists = branches.some((b) => b.slug === selectedBranchSlug);
    if (!exists && branches[0]) {
      setSelectedBranchSlug(branches[0].slug);
    }
  }, [branches, isGeneralAdmin, selectedBranchSlug, setSelectedBranchSlug, user?.branchId]);

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  // Get user initials for avatar
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "AD";

  const activeBranch = branches.find((b) => b.slug === selectedBranchSlug) ?? branches[0];

  return (
    <header className="sticky top-0 z-40 w-full bg-surface border-b border-outline shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3">
        {/* Brand Anchor & Operational Status */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to={isGeneralAdmin ? "/admin/catalogo-maestro" : "/admin/productos"}
            className="flex items-center gap-2.5 sm:gap-3"
          >
            <div className="size-8 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shadow-xs">
              <Store className="size-4" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-sm font-semibold tracking-tight text-white">
                Nutrigon
              </span>
              <span className="text-[11px] font-medium text-white/60 px-1.5 py-0.5 rounded bg-surface-elevated font-mono">
                Admin
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 ml-2">
            {isGeneralAdmin && (
              <NavLink
                to="/admin/catalogo-maestro"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
                    isActive
                      ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs"
                      : "text-zinc-400 hover:text-white hover:bg-surface-hover"
                  )
                }
              >
                <Boxes className="size-3.5" aria-hidden="true" />
                <span>Catálogo Maestro</span>
              </NavLink>
            )}

            {isGeneralAdmin && (
              <NavLink
                to="/admin/sucursales"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
                    isActive
                      ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs"
                      : "text-zinc-400 hover:text-white hover:bg-surface-hover"
                  )
                }
              >
                <Building2 className="size-3.5" aria-hidden="true" />
                <span>Sucursales</span>
              </NavLink>
            )}

            <NavLink
              to="/admin/productos"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
                  isActive
                    ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-surface-hover"
                )
              }
            >
              <Tag className="size-3.5" aria-hidden="true" />
              <span>Precios y Ofertas</span>
            </NavLink>

            <NavLink
              to="/admin/combos"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
                  isActive
                    ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-surface-hover"
                )
              }
            >
              <Package className="size-3.5" aria-hidden="true" />
              <span>Combos y Packs</span>
            </NavLink>
          </nav>
        </div>

      {/* Branch Selector + User Profile + Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Branch Context Switcher (available to General Admin or displays branch for Branch Admin) */}
        <div className="flex items-center gap-1.5 bg-surface-card border border-outline px-2.5 py-1.5 rounded-lg text-xs">
          <MapPin className="size-3.5 text-brand-gold" aria-hidden="true" />
          {isGeneralAdmin ? (
            <select
              value={activeBranch?.slug ?? selectedBranchSlug}
              onChange={(e) => setSelectedBranchSlug(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Seleccionar sucursal activa para gestionar"
            >
              {branches.map((b) => (
                <option key={b.slug} value={b.slug} className="bg-surface text-white">
                  Sucursal {b.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-white text-xs font-medium">
              Sucursal {activeBranch?.name ?? selectedBranchSlug}
            </span>
          )}
        </div>

        {/* View Public Storefront Link */}
        <Link
          to={`/catalogo/${selectedBranchSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-1 text-xs text-white/50 hover:text-brand-gold transition-colors"
          title="Ver cómo lo ve el cliente en esta sucursal"
        >
          <span>Ver Tienda</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </Link>

        <div className="h-4 w-[1px] bg-outline" aria-hidden="true" />

        {/* User Pill & Role */}
        <div className="flex items-center gap-2.5">
          <div
            className="size-8 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold font-bold text-xs flex items-center justify-center select-none shadow-xs"
            title={user?.fullName || "Administrador"}
          >
            {initials}
          </div>

          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">
              {user?.fullName || "Administrador"}
            </span>
            <span className="text-[11px] text-white/60 font-mono">
              {user?.role === Role.ADMIN_GENERAL ? "Admin General" : "Admin Sucursal"}
            </span>
          </div>

          {/* Logout Action Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-xs text-white/50 hover:text-red-400 p-2 rounded-lg hover:bg-surface-hover transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
      </div>

      {/* Mobile Navigation Row */}
      <nav className="flex md:hidden items-center border-t border-outline px-3 py-1.5 bg-surface-card/60 gap-1.5 overflow-x-auto">
        {isGeneralAdmin && (
          <NavLink
            to="/admin/catalogo-maestro"
            className={({ isActive }) =>
              cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
                isActive
                  ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                  : "text-zinc-400 hover:text-white"
              )
            }
          >
            <Boxes className="size-3.5" aria-hidden="true" />
            <span>Maestro</span>
          </NavLink>
        )}

        {isGeneralAdmin && (
          <NavLink
            to="/admin/sucursales"
            className={({ isActive }) =>
              cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
                isActive
                  ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                  : "text-zinc-400 hover:text-white"
              )
            }
          >
            <Building2 className="size-3.5" aria-hidden="true" />
            <span>Sucursales</span>
          </NavLink>
        )}

        <NavLink
          to="/admin/productos"
          className={({ isActive }) =>
            cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
              isActive
                ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                : "text-zinc-400 hover:text-white"
            )
          }
        >
          <Tag className="size-3.5" aria-hidden="true" />
          <span>Precios</span>
        </NavLink>

        <NavLink
          to="/admin/combos"
          className={({ isActive }) =>
            cn(
              "flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
              isActive
                ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                : "text-zinc-400 hover:text-white"
            )
          }
        >
          <Package className="size-3.5" aria-hidden="true" />
          <span>Combos</span>
        </NavLink>
      </nav>
    </header>
  );
}
