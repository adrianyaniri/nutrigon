import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Search,
  ShieldAlert,
  Store,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { Role } from "@/features/auth/types";
import { BranchQrModal } from "@/features/catalog/components/branch-qr-modal";
import { cn } from "@/lib/utils/cn";
import { BranchAdminCard } from "../components/branch-admin-card";
import {
  CreateBranchModal,
  EditBranchModal,
} from "../components/branch-form-modal";
import { BranchUsersModal } from "../components/branch-users-modal";
import { branchesRepository } from "../data/branches-repository";
import type {
  BranchAdminItem,
  CreateBranchInput,
  UpdateBranchInput,
} from "../types";

export function AdminBranchesPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchAdminItem | null>(
    null
  );
  const [qrBranch, setQrBranch] = useState<BranchAdminItem | null>(null);
  const [usersModalBranch, setUsersModalBranch] =
    useState<BranchAdminItem | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isGeneralAdmin = user?.role === Role.ADMIN_GENERAL;

  const branchesQuery = useQuery({
    queryKey: ["admin", "branches"],
    queryFn: () => branchesRepository.getBranches(token ?? undefined, true),
    enabled: isGeneralAdmin,
  });

  const branches = useMemo(
    () => branchesQuery.data ?? [],
    [branchesQuery.data]
  );

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateBranchInput) =>
      branchesRepository.createBranch(input, token ?? ""),
    onSuccess: (newBranch) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
      queryClient.invalidateQueries({ queryKey: ["catalog", "branches"] });
      setIsCreateModalOpen(false);
      showFeedback(
        "success",
        `Sucursal "${newBranch.name}" creada exitosamente.`
      );
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
      showFeedback(
        "success",
        `Sucursal "${updated.name}" actualizada correctamente.`
      );
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
        `Sucursal "${updated.name}" ${
          updated.isActive ? "reactivada" : "pausada"
        }.`
      );
    },
    onError: (err: Error) => {
      showFeedback(
        "error",
        err.message || "Error al cambiar estado de la sucursal."
      );
    },
  });

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.address &&
          b.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center text-white">
        <div className="max-w-md">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
            <ShieldAlert className="size-8" />
          </div>
          <h1 className="font-headline text-2xl font-bold tracking-tight">
            Acceso Restringido
          </h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Esta sección es exclusiva para el{" "}
            <strong>Administrador General</strong> de la cadena. Como
            Administrador de Sucursal, podés gestionar los precios, ofertas y
            combos de tu local asignado.
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
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 space-y-6 text-white pb-12">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline pb-6">
        <div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sucursales de la Cadena
          </h1>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Administrá los puntos de venta, canales de WhatsApp para pedidos,
            direcciones y estado operativo.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 font-semibold shadow-sm bg-brand-gold text-brand-dark hover:bg-brand-gold/90 px-5 text-xs sm:text-sm"
        >
          <Plus className="size-4" />
          <span>Nueva Sucursal</span>
        </Button>
      </div>

      {/* Operational Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-card border border-outline">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">
              Total de Sucursales
            </span>
            <span className="font-headline text-base font-bold text-white tabular-nums">
              {metrics.total}
            </span>
          </div>
          <div className="h-4 w-px bg-outline" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-medium">
              Sucursales Activas
            </span>
            <span className="font-headline text-base font-bold text-emerald-400 tabular-nums">
              {metrics.active}
            </span>
          </div>
          <div className="h-4 w-px bg-outline" aria-hidden="true" />
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-medium">Pausadas</span>
            <span className="font-headline text-base font-bold text-amber-400 tabular-nums">
              {metrics.inactive}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="size-3.5 text-emerald-400" />
          <span>Red sincronizada en tiempo real</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, dirección o WhatsApp..."
            className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-9 pr-9 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex w-full min-w-0 items-center gap-1 overflow-x-auto rounded-xl border border-outline bg-surface p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "min-h-[44px] shrink-0 px-3.5 rounded-lg text-xs font-semibold transition-colors",
              statusFilter === "all"
                ? "bg-brand-gold text-brand-dark shadow-xs"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Todas ({metrics.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={cn(
              "min-h-[44px] shrink-0 px-3.5 rounded-lg text-xs font-semibold transition-colors",
              statusFilter === "active"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Activas ({metrics.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={cn(
              "min-h-[44px] shrink-0 px-3.5 rounded-lg text-xs font-semibold transition-colors",
              statusFilter === "inactive"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
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
              className="h-64 rounded-2xl border border-outline bg-surface-card p-6 animate-pulse motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-outline bg-surface-card p-12 text-center space-y-4">
          <Store className="size-12 text-zinc-600 mb-1" />
          <div>
            <h2 className="font-headline text-base font-bold text-white">
              No se encontraron sucursales
            </h2>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
              {searchTerm
                ? `No hay coincidencias para "${searchTerm}".`
                : "No hay sucursales cargadas con el filtro seleccionado."}
            </p>
          </div>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="min-h-[44px] text-xs font-semibold border-outline hover:bg-surface-hover"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBranches.map((branch) => (
            <BranchAdminCard
              key={branch.id}
              branch={branch}
              isTogglingStatus={toggleStatusMutation.isPending}
              onEdit={setEditingBranch}
              onShowQr={setQrBranch}
              onManageUsers={setUsersModalBranch}
              onToggleStatus={(target) =>
                toggleStatusMutation.mutate({
                  id: target.id,
                  isActive: !target.isActive,
                })
              }
            />
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

      {/* Modal: Branch Users / Encargados */}
      {usersModalBranch && (
        <BranchUsersModal
          branch={usersModalBranch}
          isOpen={!!usersModalBranch}
          onClose={() => setUsersModalBranch(null)}
          onNotification={(msg) => showFeedback("success", msg)}
        />
      )}
    </div>
  );
}
