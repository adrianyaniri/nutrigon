import {
  Clock,
  Edit2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Power,
  QrCode,
  Store,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatDisplayWhatsapp } from "../lib/whatsapp-formatter";
import type { BranchAdminItem } from "../types";

export interface BranchAdminCardProps {
  branch: BranchAdminItem;
  isTogglingStatus: boolean;
  onNavigatePricing: (branch: BranchAdminItem) => void;
  onEdit: (branch: BranchAdminItem) => void;
  onShowQr: (branch: BranchAdminItem) => void;
  onToggleStatus: (branch: BranchAdminItem) => void;
}

export function BranchAdminCard({
  branch,
  isTogglingStatus,
  onNavigatePricing,
  onEdit,
  onShowQr,
  onToggleStatus,
}: BranchAdminCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border bg-surface-card p-5 shadow-sm transition-all hover:border-brand-gold/40",
        branch.isActive
          ? "border-outline"
          : "border-red-500/20 bg-red-950/10 opacity-80"
      )}
    >
      <div>
        {/* Branch Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-gold/15 border border-brand-gold/30 text-brand-gold">
              <Store className="size-5" />
            </div>
            <div>
              <h2 className="font-headline text-base font-bold text-white leading-tight">
                Sucursal {branch.name}
              </h2>
              <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 bg-surface-elevated">
                /{branch.slug}
              </span>
            </div>
          </div>

          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              branch.isActive
                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/15 border border-red-500/30 text-red-400"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                branch.isActive ? "bg-emerald-400" : "bg-red-400"
              )}
            />
            {branch.isActive ? "Activa" : "Pausada"}
          </span>
        </div>

        {/* Branch Info details */}
        <div className="mt-4 space-y-2 border-t border-outline/60 pt-3 text-xs text-zinc-300">
          <div className="flex items-start gap-2">
            <MapPin className="size-4 shrink-0 text-brand-gold mt-0.5" />
            <span className="truncate">
              {branch.address || "Sin dirección configurada"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-amber-400/90" />
            <span className="truncate">
              {branch.openingHours || "Sin horario configurado"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="size-4 shrink-0 text-zinc-400" />
            <span>{branch.phone || "Sin teléfono fijo"}</span>
          </div>

          <div className="flex items-center gap-2">
            <MessageCircle className="size-4 shrink-0 text-emerald-400" />
            {branch.whatsappNumber ? (
              <a
                href={`https://wa.me/${branch.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline font-mono text-[11px] inline-flex items-center gap-1"
                title="Probar enlace de WhatsApp"
              >
                {formatDisplayWhatsapp(branch.whatsappNumber)}
                <ExternalLink className="size-3" />
              </a>
            ) : (
              <span className="text-zinc-500">Sin WhatsApp asignado</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-5 space-y-2.5 border-t border-outline/60 pt-3">
        <Button
          type="button"
          onClick={() => onEdit(branch)}
          className="w-full min-h-[44px] text-xs font-semibold gap-2 bg-brand-gold text-surface hover:bg-brand-gold/90 transition-colors shadow-xs"
        >
          <Edit2 className="size-3.5" />
          <span>Editar Sucursal</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigatePricing(branch)}
            title={`Ver precios y ofertas de Sucursal ${branch.name}`}
            className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5 border-outline bg-surface-elevated/40 text-zinc-300 hover:bg-surface-hover hover:text-white"
          >
            <Tag className="size-3.5 text-brand-gold" />
            <span>Precios y Ofertas</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onShowQr(branch)}
            title={`Ver y descargar código QR de Sucursal ${branch.name}`}
            className="min-h-[44px] min-w-[44px] px-3 border-outline bg-surface-elevated/40 text-brand-gold hover:bg-surface-hover"
          >
            <QrCode className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onToggleStatus(branch)}
            disabled={isTogglingStatus}
            title={branch.isActive ? "Pausar sucursal" : "Reactivar sucursal"}
            className={cn(
              "min-h-[44px] min-w-[44px] px-3 border-outline transition-colors",
              branch.isActive
                ? "text-zinc-400 hover:text-amber-400 hover:border-amber-400/40"
                : "text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
            )}
          >
            <Power className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
