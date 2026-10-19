import { useState, useRef, useEffect } from "react";
import { KeyRound, Lock, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogFocusTrap } from "@/hooks";
import { useAuth } from "../context/auth-context";
import { usersRepository } from "@/features/users/data/users-repository";

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNotification?: (message: string) => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccessNotification,
}: ChangePasswordModalProps) {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialInputRef = useRef<HTMLInputElement>(null);

  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: () => {
      if (!isSubmitting) onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => initialInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Por favor ingresá tu contraseña actual.");
      return;
    }
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await usersRepository.changePassword(
        { currentPassword, newPassword },
        token ?? "mock-jwt-token"
      );
      if (onSuccessNotification) {
        onSuccessNotification(res.message || "Contraseña actualizada exitosamente.");
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cambiar la contraseña.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-outline bg-surface-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold border border-brand-gold/25">
              <KeyRound className="size-4.5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="change-password-title"
                className="font-headline text-base font-bold text-foreground"
              >
                Cambiar mi contraseña
              </h2>
              <p className="text-xs text-muted-foreground">
                Actualizá tu clave de acceso personal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal de cambio de contraseña"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-status-destructive/30 bg-status-destructive/10 p-3 text-xs text-status-destructive">
              <AlertCircle className="size-4 shrink-0 text-status-destructive mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="current-password"
              className="block text-xs font-semibold text-foreground/90 mb-1.5"
            >
              Contraseña actual
            </label>
            <div className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <input
                ref={initialInputRef}
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresá tu contraseña actual"
                disabled={isSubmitting}
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-9.5 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold text-foreground/90 mb-1.5"
            >
              Nueva contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={isSubmitting}
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-9.5 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold text-foreground/90 mb-1.5"
            >
              Confirmar nueva contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la nueva contraseña"
                disabled={isSubmitting}
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-9.5 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] text-xs font-semibold px-4 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] bg-brand-gold text-brand-dark hover:bg-brand-gold-hover text-xs font-semibold px-5 gap-2 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Guardar Contraseña</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
