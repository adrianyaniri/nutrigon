import { LogOut, MapPin, Store, ExternalLink } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Role } from "../types";

export function AdminHeader() {
  const { user, logout, selectedBranchSlug, setSelectedBranchSlug } = useAuth();
  const navigate = useNavigate();

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

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 w-full bg-surface border-b border-white/[0.08] shadow-sm">
      {/* Brand Anchor & Operational Status */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/admin/productos" className="flex items-center gap-2.5 sm:gap-3">
          <div className="size-8 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shadow-xs">
            <Store className="size-4" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline text-sm font-semibold tracking-tight text-white">
              Nutrigon
            </span>
            <span className="text-[10px] sm:text-[11px] font-medium text-white/50 px-1.5 py-0.5 rounded bg-white/[0.05] font-mono">
              Admin
            </span>
          </div>
        </Link>

        <div className="hidden sm:block h-4 w-[1px] bg-white/[0.08]" aria-hidden="true" />

        <div className="hidden sm:flex items-center gap-2 text-xs text-white/50">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/80 font-medium">Sucursales Conectadas</span>
        </div>
      </div>

      {/* Branch Selector + User Profile + Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Branch Context Switcher (available to General Admin or displays branch for Branch Admin) */}
        <div className="flex items-center gap-1.5 bg-[#111215] border border-white/[0.08] px-2.5 py-1.5 rounded-lg text-xs">
          <MapPin className="size-3.5 text-brand-gold" aria-hidden="true" />
          {isGeneralAdmin ? (
            <select
              value={selectedBranchSlug}
              onChange={(e) => setSelectedBranchSlug(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Seleccionar sucursal activa para gestionar"
            >
              <option value="origone" className="bg-surface text-white">
                Sucursal Origone
              </option>
              <option value="pedro-diaz" className="bg-surface text-white">
                Sucursal Pedro Díaz
              </option>
              <option value="w-morris" className="bg-surface text-white">
                Sucursal William Morris
              </option>
            </select>
          ) : (
            <span className="text-white text-xs font-medium uppercase">
              {selectedBranchSlug}
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

        <div className="h-4 w-[1px] bg-white/[0.08]" aria-hidden="true" />

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
            <span className="text-[10px] text-white/50 font-mono">
              {user?.role === Role.ADMIN_GENERAL ? "Admin General" : "Admin Sucursal"}
            </span>
          </div>

          {/* Logout Action Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
