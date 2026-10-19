import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  KeyRound,
  Mail,
  User,
  Lock,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-context";
import { usersRepository } from "@/features/users/data/users-repository";
import type { BranchAdminItem } from "../types";
import type { UserItem } from "@/features/users/types";
import { Role } from "@nutrigon/contracts";

export interface BranchUsersModalProps {
  branch: BranchAdminItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNotification: (msg: string) => void;
}

export function BranchUsersModal({
  branch,
  isOpen,
  onClose,
  onNotification,
}: BranchUsersModalProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserItem | null>(null);

  // Form states for creating a new branch manager
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for resetting password
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  const branchId = branch?.id ?? "";
  const authToken = token ?? "mock-jwt-token";

  const usersQuery = useQuery({
    queryKey: ["branch-users", branchId],
    queryFn: () => usersRepository.listByBranch(branchId, authToken),
    enabled: isOpen && !!branchId,
  });

  useEffect(() => {
    if (isOpen) {
      setIsCreating(false);
      setResetTargetUser(null);
      setFullName("");
      setEmail("");
      setPassword("");
      setFormError(null);
      setNewPassword("");
      setResetError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        if (resetTargetUser) {
          setResetTargetUser(null);
        } else if (isCreating) {
          setIsCreating(false);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCreating, resetTargetUser, onClose]);

  const createUserMutation = useMutation({
    mutationFn: (data: { email: string; fullName: string; password: string }) =>
      usersRepository.createUser(
        {
          email: data.email,
          fullName: data.fullName,
          password: data.password,
          role: Role.BRANCH_ADMIN,
          branchId,
        },
        authToken
      ),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ["branch-users", branchId] });
      setIsCreating(false);
      setFullName("");
      setEmail("");
      setPassword("");
      setFormError(null);
      onNotification(`Encargado "${newUser.fullName}" creado y asignado a ${branch?.name}.`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Error al crear el encargado.";
      setFormError(msg);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { userId: string; newPass: string }) =>
      usersRepository.resetPassword(data.userId, data.newPass, authToken),
    onSuccess: (res) => {
      setResetTargetUser(null);
      setNewPassword("");
      setResetError(null);
      onNotification(res.message || "Contraseña restablecida exitosamente.");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Error al restablecer la contraseña.";
      setResetError(msg);
    },
  });

  if (!isOpen || !branch) return null;

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError("El nombre completo debe tener al menos 2 caracteres.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Ingresá un correo electrónico válido.");
      return;
    }
    if (password.length < 6) {
      setFormError("La contraseña inicial debe tener al menos 6 caracteres.");
      return;
    }

    createUserMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
  }

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);

    if (!newPassword || newPassword.length < 6) {
      setResetError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (resetTargetUser) {
      resetPasswordMutation.mutate({
        userId: resetTargetUser.id,
        newPass: newPassword,
      });
    }
  }

  const users = usersQuery.data ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-users-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-outline bg-surface-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/25">
              <Users className="size-4.5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="branch-users-title"
                className="font-headline text-base font-bold text-foreground"
              >
                Encargados · Sucursal {branch.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                Administrá los usuarios autorizados a operar esta sucursal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de encargados"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {/* Create User Form Section */}
          {isCreating ? (
            <form
              onSubmit={handleCreateSubmit}
              className="rounded-xl border border-brand-gold/30 bg-surface p-4 space-y-3.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-gold">
                  Nuevo Encargado para {branch.name}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200">
                  <AlertCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="user-fullname"
                  className="block text-xs font-semibold text-foreground/90 mb-1"
                >
                  Nombre y Apellido
                </label>
                <div className="relative flex items-center">
                  <User className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                  <input
                    id="user-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Romina Gómez"
                    className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-card pl-9.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-email"
                  className="block text-xs font-semibold text-foreground/90 mb-1"
                >
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                  <input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@nutrigon.com"
                    className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-card pl-9.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="user-initial-password"
                  className="block text-xs font-semibold text-foreground/90 mb-1"
                >
                  Contraseña Inicial (mínimo 6 caracteres)
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                  <input
                    id="user-initial-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña provisoria"
                    className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-card pl-9.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  disabled={createUserMutation.isPending}
                  className="min-h-[44px] text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold-hover text-xs font-semibold px-4 gap-1.5"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      <span>Crear Encargado</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Usuarios con acceso a esta sucursal ({users.length})
              </span>
              <Button
                type="button"
                onClick={() => setIsCreating(true)}
                className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold-hover text-xs font-semibold px-3.5 gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="size-3.5" />
                <span>Agregar Encargado</span>
              </Button>
            </div>
          )}

          {/* Reset Password Form Section */}
          {resetTargetUser && (
            <form
              onSubmit={handleResetSubmit}
              className="rounded-xl border border-amber-500/40 bg-surface p-4 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">
                  Resetear contraseña de: {resetTargetUser.fullName}
                </span>
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>

              {resetError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200">
                  <AlertCircle className="size-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="user-reset-password"
                  className="block text-xs font-semibold text-foreground/90 mb-1"
                >
                  Nueva contraseña directa
                </label>
                <div className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                  <input
                    id="user-reset-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-card pl-9.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetTargetUser(null)}
                  disabled={resetPasswordMutation.isPending}
                  className="min-h-[44px] text-xs font-semibold"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="min-h-[44px] bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs px-4 gap-1.5"
                >
                  {resetPasswordMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  <span>Confirmar Nueva Clave</span>
                </Button>
              </div>
            </form>
          )}

          {/* Users List */}
          {usersQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="size-4 animate-spin text-brand-gold" />
              <span>Cargando encargados...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-outline py-8 text-center px-4">
              <Users className="size-8 text-muted-foreground/60 mb-2" />
              <p className="text-xs font-semibold text-foreground">
                No hay encargados asignados a esta sucursal todavía
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Creá un usuario para que pueda administrar precios, ofertas y combos localmente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl border border-outline bg-surface p-3 transition-colors hover:border-outline-variant"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {u.fullName}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <ShieldCheck className="size-3" />
                        <span>Activo</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono block truncate mt-0.5">
                      {u.email}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setResetTargetUser(u);
                      setNewPassword("");
                      setResetError(null);
                    }}
                    title={`Resetear contraseña de ${u.fullName}`}
                    aria-label={`Resetear contraseña de ${u.fullName}`}
                    className="min-h-[44px] text-xs font-medium gap-1.5 border-outline hover:border-amber-500/50 hover:text-amber-300"
                  >
                    <KeyRound className="size-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Resetear Clave</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
