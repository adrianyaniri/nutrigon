import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit2,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Power,
  QrCode,
  Search,
  ShieldAlert,
  Store,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { Role } from "@/features/auth/types";
import { BranchQrModal } from "@/features/catalog/components/branch-qr-modal";
import { cn } from "@/lib/utils/cn";
import { branchesRepository } from "../data/branches-repository";
import type { BranchAdminItem, CreateBranchInput, UpdateBranchInput } from "../types";

export function AdminBranchesPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchAdminItem | null>(null);
  const [qrBranch, setQrBranch] = useState<BranchAdminItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;

  const branchesQuery = useQuery({
    queryKey: ["admin", "branches"],
    queryFn: () => branchesRepository.getBranches(token ?? undefined, true),
    enabled: isGeneralAdmin,
  });

  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateBranchInput) => branchesRepository.createBranch(input, token ?? ""),
    onSuccess: (newBranch) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
      queryClient.invalidateQueries({ queryKey: ["catalog", "branches"] });
      setIsCreateModalOpen(false);
      showFeedback("success", `Sucursal "${newBranch.name}" creada exitosamente.`);
    },
    onError: (err: Error) => {
      showFeedback("error", err.message || "Error al crear la sucursal.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBranchInput }) =>
      branchesRepository.updateBranch(id, input, token ?? ""),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
      queryClient.invalidateQueries({ queryKey: ["catalog", "branches"] });
      setEditingBranch(null);
      showFeedback("success", `Sucursal "${updated.name}" actualizada correctamente.`);
    },
    onError: (err: Error) => {
      showFeedback("error", err.message || "Error al actualizar la sucursal.");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      branchesRepository.updateBranch(id, { isActive }, token ?? ""),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
      queryClient.invalidateQueries({ queryKey: ["catalog", "branches"] });
      showFeedback(
        "success",
        `Sucursal "${updated.name}" ${updated.isActive ? "reactivada" : "pausada"}.`
      );
    },
    onError: (err: Error) => {
      showFeedback("error", err.message || "Error al cambiar estado de la sucursal.");
    },
  });

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.address && b.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.whatsappNumber && b.whatsappNumber.includes(searchTerm));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && b.isActive) ||
        (statusFilter === "inactive" && !b.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [branches, searchTerm, statusFilter]);

  const metrics = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [branches]);

  // Access restriction shield for non-general admins
  if (!isGeneralAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-white">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <ShieldAlert className="size-8" />
        </div>
        <h1 className="font-headline text-2xl font-bold tracking-tight">Acceso Restringido</h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Esta sección es exclusiva para el <strong>Administrador General</strong> de la cadena.
          Como Administrador de Sucursal, podés gestionar los precios, ofertas y combos de tu local
          asignado.
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => navigate("/admin/productos")}
            className="min-h-[44px] font-semibold"
          >
            Ir a Precios de mi Sucursal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Feedback Notification Banner */}
      {feedback && (
        <div
          role="status"
          className={cn(
            "flex items-center justify-between rounded-xl p-4 text-xs font-semibold shadow-md transition-all animate-in fade-in slide-in-from-top-2",
            feedback.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/15 border border-red-500/30 text-red-400"
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-zinc-400 hover:text-white"
            aria-label="Cerrar notificación"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 px-3 py-1 text-xs font-semibold text-brand-gold mb-2">
            <Building2 className="size-3.5" />
            Gestión Corporativa
          </div>
          <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tight">
            Sucursales de la Cadena
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Administrá los puntos de venta, canales de WhatsApp para pedidos, direcciones y estado
            operativo.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 font-semibold shadow-sm"
        >
          <Plus className="size-4" />
          <span>Nueva Sucursal</span>
        </Button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-[#111215] p-4 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400">Total de Sucursales</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{metrics.total}</span>
            <span className="text-xs text-zinc-500 font-mono">locales</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#111215] p-4 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400">Sucursales Activas</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{metrics.active}</span>
            <span className="text-xs text-emerald-500/70 font-mono">en catálogo público</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#111215] p-4 shadow-2xs">
          <span className="text-xs font-medium text-zinc-400">Sucursales Pausadas</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{metrics.inactive}</span>
            <span className="text-xs text-amber-500/70 font-mono">temporalmente ocultas</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, dirección o WhatsApp..."
            className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] pl-9 pr-4 text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#111215] p-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors",
              statusFilter === "all"
                ? "bg-brand-gold text-[#121316] shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Todas ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={cn(
              "min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors",
              statusFilter === "active"
                ? "bg-brand-gold text-[#121316] shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Activas ({metrics.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={cn(
              "min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors",
              statusFilter === "inactive"
                ? "bg-brand-gold text-[#121316] shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Pausadas ({metrics.inactive})
          </button>
        </div>
      </div>

      {/* Branches List Grid */}
      {branchesQuery.isPending ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl border border-white/[0.08] bg-[#111215] p-6 animate-pulse"
            />
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-[#111215] p-12 text-center">
          <Store className="size-12 text-zinc-600 mb-3" />
          <h2 className="font-headline text-base font-bold text-white">
            No se encontraron sucursales
          </h2>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            {searchTerm
              ? `No hay coincidencias para "${searchTerm}".`
              : "No hay sucursales cargadas con el filtro seleccionado."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className={cn(
                "flex flex-col justify-between rounded-2xl border bg-[#111215] p-5 shadow-sm transition-all hover:border-brand-gold/40",
                branch.isActive ? "border-white/[0.08]" : "border-red-500/20 bg-red-950/10 opacity-80"
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
                      <span className="inline-block mt-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 bg-white/[0.05]">
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
                <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-3 text-xs text-zinc-300">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 shrink-0 text-brand-gold mt-0.5" />
                    <span className="truncate">{branch.address || "Sin dirección configurada"}</span>
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
                        +{branch.whatsappNumber}
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-500">Sin WhatsApp asignado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBranch(branch)}
                  className="flex-1 min-h-[40px] text-xs font-semibold gap-1.5 border-white/[0.1] bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08] hover:text-white"
                >
                  <Edit2 className="size-3.5" />
                  <span>Editar</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQrBranch(branch)}
                  title={`Ver y descargar código QR de Sucursal ${branch.name}`}
                  className="min-h-[40px] px-2.5 border-white/[0.1] bg-white/[0.04] text-brand-gold hover:bg-white/[0.08]"
                >
                  <QrCode className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: branch.id,
                      isActive: !branch.isActive,
                    })
                  }
                  disabled={toggleStatusMutation.isPending}
                  title={branch.isActive ? "Pausar sucursal" : "Reactivar sucursal"}
                  className={cn(
                    "min-h-[40px] px-2.5 border-white/[0.1] transition-colors",
                    branch.isActive
                      ? "text-zinc-400 hover:text-amber-400 hover:border-amber-400/40"
                      : "text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                  )}
                >
                  <Power className="size-4" />
                </Button>

                <Link
                  to={`/catalogo/${branch.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-brand-gold hover:border-brand-gold/40 transition-colors"
                  title="Abrir catálogo público de esta sucursal"
                >
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Branch */}
      {isCreateModalOpen && (
        <CreateBranchModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(input) => createMutation.mutate(input)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Modal: Edit Branch */}
      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          isOpen={!!editingBranch}
          onClose={() => setEditingBranch(null)}
          onSubmit={(input) =>
            updateMutation.mutate({
              id: editingBranch.id,
              input,
            })
          }
          isSubmitting={updateMutation.isPending}
        />
      )}

      {/* Modal: QR Code */}
      {qrBranch && (
        <BranchQrModal
          isOpen={!!qrBranch}
          onClose={() => setQrBranch(null)}
          branch={qrBranch}
        />
      )}
    </div>
  );
}

// Subcomponent: Modal to create branch
function CreateBranchModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateBranchInput) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleNameChange(val: string) {
    setName(val);
    const suggestedSlug = val
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(suggestedSlug);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug.trim())) {
      setError("El slug solo puede contener letras minúsculas, números y guiones.");
      return;
    }

    const cleanWhatsapp = whatsappNumber.trim().replace(/[^0-9]/g, "");
    if (cleanWhatsapp && !/^[1-9]\d{7,14}$/.test(cleanWhatsapp)) {
      setError("Formato de WhatsApp inválido. Ejemplo: 5491144501001");
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      whatsappNumber: cleanWhatsapp || null,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-branch-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#121316] p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-white"
          aria-label="Cerrar modal"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
            <Building2 className="size-4.5" />
          </div>
          <div>
            <h2 id="create-branch-title" className="font-headline text-lg font-bold">
              Nueva Sucursal
            </h2>
            <p className="text-xs text-zinc-400">
              Registrá un nuevo punto de venta para el catálogo y pedidos.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="create-branch-name" className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre de la Sucursal *
            </label>
            <input
              id="create-branch-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. Morón, Castelar, Ramos Mejía"
              className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="create-branch-slug" className="block text-xs font-semibold text-zinc-300 mb-1">
              Slug de URL *
            </label>
            <div className="flex items-center rounded-xl border border-white/[0.1] bg-[#111215] px-3 focus-within:border-brand-gold">
              <span className="font-mono text-xs text-zinc-500 select-none">/catalogo/</span>
              <input
                id="create-branch-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="moron"
                className="w-full min-h-[44px] bg-transparent font-mono text-xs text-white focus:outline-none"
              />
            </div>
            <span className="mt-1 block text-[11px] text-zinc-500">
              Identificador único para la URL del catálogo y códigos QR.
            </span>
          </div>

          <div>
            <label htmlFor="create-branch-address" className="block text-xs font-semibold text-zinc-300 mb-1">
              Dirección Física
            </label>
            <input
              id="create-branch-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Av. Rivadavia 18200"
              className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="create-branch-phone" className="block text-xs font-semibold text-zinc-300 mb-1">
                Teléfono Fijo / Local
              </label>
              <input
                id="create-branch-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 11-4450-1234"
                className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="create-branch-whatsapp" className="block text-xs font-semibold text-zinc-300 mb-1">
                WhatsApp de Pedidos
              </label>
              <input
                id="create-branch-whatsapp"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="5491144501234"
                className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 font-mono text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
              />
            </div>
          </div>
          <span className="block text-[11px] text-zinc-500">
            El número de WhatsApp recibe los carritos de compra de los clientes de esta sucursal.
          </span>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] border-white/[0.1] text-zinc-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] font-semibold"
            >
              {isSubmitting ? "Creando..." : "Crear Sucursal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent: Modal to edit branch
function EditBranchModal({
  branch,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  branch: BranchAdminItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: UpdateBranchInput) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address ?? "");
  const [phone, setPhone] = useState(branch.phone ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(branch.whatsappNumber ?? "");
  const [isActive, setIsActive] = useState(branch.isActive);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    const cleanWhatsapp = whatsappNumber.trim().replace(/[^0-9]/g, "");
    if (cleanWhatsapp && !/^[1-9]\d{7,14}$/.test(cleanWhatsapp)) {
      setError("Formato de WhatsApp inválido. Ejemplo: 5491144501001");
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
      whatsappNumber: cleanWhatsapp || null,
      isActive,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-branch-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in"
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.12] bg-[#121316] p-6 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-zinc-400 hover:text-white"
          aria-label="Cerrar modal"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/30">
            <Edit2 className="size-4" />
          </div>
          <div>
            <h2 id="edit-branch-title" className="font-headline text-lg font-bold">
              Editar Sucursal {branch.name}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">slug: /{branch.slug}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-branch-name" className="block text-xs font-semibold text-zinc-300 mb-1">
              Nombre de la Sucursal *
            </label>
            <input
              id="edit-branch-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-branch-address" className="block text-xs font-semibold text-zinc-300 mb-1">
              Dirección Física
            </label>
            <input
              id="edit-branch-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej. Tte. Manuel Origone 196, Villa Tesei"
              className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-branch-phone" className="block text-xs font-semibold text-zinc-300 mb-1">
                Teléfono Fijo / Local
              </label>
              <input
                id="edit-branch-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej. 11-4450-1001"
                className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="edit-branch-whatsapp" className="block text-xs font-semibold text-zinc-300 mb-1">
                WhatsApp de Pedidos
              </label>
              <input
                id="edit-branch-whatsapp"
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="5491144501001"
                className="w-full min-h-[44px] rounded-xl border border-white/[0.1] bg-[#111215] px-3 font-mono text-xs text-white placeholder:text-zinc-500 focus:border-brand-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#111215] p-3.5">
            <div>
              <label htmlFor="is-branch-active-toggle" className="text-xs font-semibold text-white block cursor-pointer">
                Estado de la Sucursal
              </label>
              <span className="text-[11px] text-zinc-400">
                {isActive
                  ? "Visible y operativa para los clientes en el catálogo web."
                  : "Pausada: oculta en el catálogo para no recibir pedidos temporales."}
              </span>
            </div>
            <input
              type="checkbox"
              id="is-branch-active-toggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="size-5 rounded border-white/20 bg-white/10 text-brand-gold focus:ring-brand-gold cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] border-white/[0.1] text-zinc-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] font-semibold"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
