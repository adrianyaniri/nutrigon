import { ExternalLink, Layers, MapPin, ShieldCheck, Store, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth, Role } from "@/features/auth";

export function AdminProductsPage() {
  const { user, selectedBranchSlug } = useAuth();

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 max-w-screen-xl mx-auto w-full">
      {/* Top Banner / Welcome Header */}
      <div className="rounded-2xl border border-white/[0.08] bg-surface-card p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Sesión Autenticada contra Backend NestJS</span>
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Gestión de Catálogo &amp; Precios
            </h1>

            <p className="text-sm text-brand-muted max-w-2xl leading-relaxed">
              Bienvenido, <strong className="text-white">{user?.fullName}</strong>. Estás
              operando con permisos de{" "}
              <span className="text-brand-gold font-semibold">
                {isGeneralAdmin ? "Administrador General" : "Encargado de Sucursal"}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/catalogo/${selectedBranchSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-stone-950 font-headline font-bold text-xs sm:text-sm px-4 py-2.5 transition-all shadow-md shadow-brand-gold/15 active:scale-95"
            >
              <Store className="size-4" aria-hidden="true" />
              <span>Ver Catálogo Público {selectedBranchSlug.toUpperCase()}</span>
              <ExternalLink className="size-3.5 ml-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Current Session Specs Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/[0.06]">
          <div className="rounded-xl border border-white/[0.06] bg-[#111215] p-4 flex items-start gap-3">
            <UserCheck className="size-5 text-brand-gold shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-white/50 block font-semibold">
                Usuario Activo
              </span>
              <span className="text-sm font-medium text-white block mt-0.5">
                {user?.fullName}
              </span>
              <span className="text-xs text-white/40 font-mono">{user?.email}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#111215] p-4 flex items-start gap-3">
            <MapPin className="size-5 text-brand-gold shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-white/50 block font-semibold">
                Punto de Venta Activo
              </span>
              <span className="text-sm font-medium text-white block mt-0.5 capitalize">
                Sucursal {selectedBranchSlug}
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                Sincronizada con base de datos
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#111215] p-4 flex items-start gap-3">
            <Layers className="size-5 text-brand-gold shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-white/50 block font-semibold">
                Nivel de Acceso
              </span>
              <span className="text-sm font-medium text-white block mt-0.5">
                {user?.role}
              </span>
              <span className="text-xs text-white/40">
                {isGeneralAdmin
                  ? "Gestión global de sucursales y productos"
                  : "Precios y visibilidad de sucursal"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
