import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  MapPin,
  Store,
  ExternalLink,
  Tag,
  Package,
  Boxes,
  Building2,
  KeyRound,
  CheckCircle2,
  QrCode,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BranchQrModal } from "@/features/catalog/components/branch-qr-modal";
import { useBranches } from "@/features/catalog/hooks/use-catalog-queries";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "../context/auth-context";
import { Role } from "../types";
import { ChangePasswordModal } from "./change-password-modal";

export function AdminHeader() {
  const { user, logout, selectedBranchSlug, setSelectedBranchSlug } = useAuth();
  const navigate = useNavigate();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [passwordNotification, setPasswordNotification] = useState<string | null>(null);

  // Close dropdown menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUserMenuOpen]);

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
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-2 px-4 py-2.5 sm:px-6 sm:py-3 lg:flex lg:justify-between lg:gap-4">
        {/* Brand Anchor & Operational Status */}
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            to={isGeneralAdmin ? "/admin/catalogo-maestro" : "/admin/productos"}
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <div className="size-8 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shadow-xs">
              <Store className="size-4" aria-hidden="true" />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-headline text-sm font-semibold tracking-tight text-foreground">
                Nutrigon
              </span>
              <span className="hidden sm:inline text-[11px] font-medium text-muted-foreground px-1.5 py-0.5 rounded bg-surface-elevated font-mono">
                Admin
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5 ml-2">
            {isGeneralAdmin && (
              <NavLink
                to="/admin/catalogo-maestro"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px]",
                    isActive
                      ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30 shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
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
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
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
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
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
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                )
              }
            >
              <Package className="size-3.5" aria-hidden="true" />
              <span>Combos y Packs</span>
            </NavLink>
          </nav>
        </div>

      {/* Branch Selector + User Account Dropdown */}
      <div className="contents lg:flex lg:min-w-0 lg:items-center lg:gap-3 xl:gap-4">
        {/* Branch Context Switcher (available to General Admin or displays branch for Branch Admin) */}
        <div className="col-span-3 row-start-2 flex min-h-[44px] min-w-0 w-full items-center gap-1.5 rounded-lg border border-outline bg-surface-card px-3 py-1.5 text-xs lg:w-auto lg:max-w-64">
          <MapPin className="size-3.5 text-brand-gold shrink-0" aria-hidden="true" />
          {branches.length === 0 ? (
            isGeneralAdmin ? (
              <Link
                to="/admin/sucursales"
                className="min-w-0 truncate text-brand-gold hover:underline text-xs font-semibold"
                title="Registrar primera sucursal"
              >
                Sin sucursales (+ Crear)
              </Link>
            ) : (
              <span className="min-w-0 truncate text-muted-foreground text-xs font-medium">
                Sin sucursal asignada
              </span>
            )
          ) : isGeneralAdmin ? (
            <select
              value={activeBranch?.slug ?? selectedBranchSlug}
              onChange={(e) => setSelectedBranchSlug(e.target.value)}
              className="min-w-0 w-full bg-transparent text-foreground text-xs font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Seleccionar sucursal activa para gestionar"
            >
              {branches.map((b) => (
                <option key={b.slug} value={b.slug} className="bg-surface text-foreground">
                  Sucursal {b.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="min-w-0 truncate text-foreground text-xs font-medium" title={`Sucursal ${activeBranch?.name ?? selectedBranchSlug}`}>
              Sucursal {activeBranch?.name ?? selectedBranchSlug}
            </span>
          )}
        </div>

        {/* Branch QR & Public Storefront Actions (only if activeBranch exists) */}
        {activeBranch && (
          <div className="col-start-2 row-start-1 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              aria-label={`Ver código QR de Sucursal ${activeBranch.name}`}
              title={`Ver, descargar o imprimir QR de Sucursal ${activeBranch.name}`}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-outline bg-surface-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-brand-gold hover:text-brand-gold transition-colors cursor-pointer"
            >
              <QrCode className="size-3.5 text-brand-gold shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">QR Sucursal</span>
            </button>

            <Link
              to={`/catalogo/${activeBranch.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-gold transition-colors px-1.5"
              title="Ver cómo lo ve el cliente en esta sucursal"
            >
              <span>Ver Tienda</span>
              <ExternalLink className="size-3" aria-hidden="true" />
            </Link>
          </div>
        )}

        <div className="hidden h-4 w-px bg-outline lg:block" aria-hidden="true" />

        {/* User Account Dropdown */}
        <div className="relative col-start-3 row-start-1" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            aria-label="Menú de cuenta de usuario"
            className={cn(
              "flex items-center gap-2 rounded-xl p-1 sm:px-2 sm:py-1.5 transition-colors cursor-pointer min-h-[44px]",
              isUserMenuOpen
                ? "bg-surface-hover border border-outline"
                : "hover:bg-surface-hover border border-transparent hover:border-outline"
            )}
          >
            <div
              className="size-8 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold font-bold text-xs flex items-center justify-center select-none shadow-xs shrink-0"
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-semibold text-foreground truncate max-w-[120px] md:max-w-[160px]">
                {user?.fullName || "Administrador"}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {user?.role === Role.ADMIN_GENERAL ? "Admin General" : "Admin Sucursal"}
              </span>
            </div>

            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform duration-200",
                isUserMenuOpen && "rotate-180 text-brand-gold"
              )}
              aria-hidden="true"
            />
          </button>

          {/* Floating Dropdown Card */}
          {isUserMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-outline bg-surface-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              {/* User Identity Header */}
              <div className="px-3 py-2.5 border-b border-outline/70">
                <p className="text-xs font-bold text-foreground truncate">
                  {user?.fullName || "Administrador"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-mono">
                  {user?.email}
                </p>
                <div className="mt-1.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-gold/15 text-brand-gold border border-brand-gold/25 font-mono">
                    {user?.role === Role.ADMIN_GENERAL ? "ADMIN GENERAL" : "ADMIN SUCURSAL"}
                  </span>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="py-1">
                {activeBranch && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsQrModalOpen(true);
                    }}
                    className="flex w-full min-h-[44px] items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-hover rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <QrCode className="size-4 text-brand-gold shrink-0" aria-hidden="true" />
                    <span>Código QR de {activeBranch.name}</span>
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="flex w-full min-h-[44px] items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-hover rounded-xl transition-colors cursor-pointer text-left"
                >
                  <KeyRound className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span>Cambiar mi contraseña</span>
                </button>
              </div>

              <div className="h-[1px] bg-outline/70 my-1" />

              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full min-h-[44px] items-center gap-2.5 px-3 py-2 text-xs font-semibold text-status-destructive hover:bg-status-destructive/10 rounded-xl transition-colors cursor-pointer text-left"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Floating Password Changed Feedback Toast */}
      {passwordNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-status-success/30 bg-surface-card p-4 text-xs font-semibold text-status-success shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="size-4.5 text-status-success shrink-0" />
          <span>{passwordNotification}</span>
          <button
            type="button"
            onClick={() => setPasswordNotification(null)}
            className="ml-2 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccessNotification={(msg) => {
          setPasswordNotification(msg);
          setTimeout(() => setPasswordNotification(null), 4000);
        }}
      />

      {/* Branch QR Modal for Active Branch */}
      {activeBranch && (
        <BranchQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          branch={activeBranch}
        />
      )}


      {/* Mobile Navigation Row */}
      <nav className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain border-t border-outline bg-surface-card/60 px-3 py-1.5 xl:hidden">
        {isGeneralAdmin && (
          <NavLink
            to="/admin/catalogo-maestro"
            className={({ isActive }) =>
              cn(
                "flex-none flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
                isActive
                  ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                  : "text-muted-foreground hover:text-foreground"
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
                "flex-none flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
                isActive
                  ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                  : "text-muted-foreground hover:text-foreground"
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
              "flex-none flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
              isActive
                ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                : "text-muted-foreground hover:text-foreground"
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
              "flex-none flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[44px] whitespace-nowrap",
              isActive
                ? "bg-brand-gold/15 text-brand-gold border border-brand-gold/30"
                : "text-muted-foreground hover:text-foreground"
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
