import { useState } from "react";
import { Building2, Clock, Edit2, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialogFocusTrap } from "@/hooks";
import { cn } from "@/lib/utils/cn";
import {
  formatDisplayWhatsapp,
  validateWhatsapp,
} from "../lib/whatsapp-formatter";
import type {
  BranchAdminItem,
  CreateBranchInput,
  UpdateBranchInput,
} from "../types";

export interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateBranchInput) => void;
  isSubmitting: boolean;
}

export function CreateBranchModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateBranchModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const whatsappValidation = validateWhatsapp(whatsappNumber, false);

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

    if (whatsappNumber.trim() && !whatsappValidation.isValid) {
      setError(whatsappValidation.error || "Formato de WhatsApp inválido.");
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      slug: slug.trim(),
      address: address.trim() || null,
      openingHours: openingHours.trim() || null,
      phone: phone.trim() || null,
      whatsappNumber: whatsappValidation.normalized,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-branch-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-outline bg-surface-card p-6 shadow-2xl text-white overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center -mt-2 pb-3">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:bg-surface-hover hover:text-white"
          aria-label="Cerrar modal"
        >
          <X className="size-5" />
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
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="create-branch-slug" className="block text-xs font-semibold text-zinc-300 mb-1">
              Slug de URL *
            </label>
            <div className="flex items-center rounded-xl border border-outline bg-surface px-3.5 focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold">
              <span className="font-mono text-xs text-zinc-500 select-none">/catalogo/</span>
              <input
                id="create-branch-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="moron"
                className="w-full min-h-[44px] bg-transparent font-mono text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:outline-none"
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
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="create-branch-hours" className="block text-xs font-semibold text-zinc-300 mb-1">
              Horarios de Atención
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <input
                id="create-branch-hours"
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Ej. Lun a Sáb 9:00 a 13:00 y 16:30 a 20:30"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-10 pr-3.5 text-xs text-white placeholder:text-zinc-500 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>
            <span className="mt-1 block text-[11px] text-zinc-500">
              Visible para los clientes en el catálogo web y selección de sucursal.
            </span>
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
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
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
                placeholder="Ej. 11 4450-1001 o 5491144501001"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 font-mono text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>
          </div>

          {whatsappNumber.trim() ? (
            <div
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border text-xs",
                whatsappValidation.isValid
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/25 text-amber-300"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageCircle className="size-4 shrink-0 text-emerald-400" />
                <span className="truncate font-mono text-[11px]">
                  {whatsappValidation.isValid
                    ? `wa.me/${whatsappValidation.normalized} (${formatDisplayWhatsapp(whatsappNumber)})`
                    : whatsappValidation.error}
                </span>
              </div>
              {whatsappValidation.isValid && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                  Válido
                </span>
              )}
            </div>
          ) : (
            <span className="block text-[11px] text-zinc-500">
              Podés ingresar el celular con o sin código de país (ej. 11 4450-1001 o 011-15...). Se normalizará automáticamente.
            </span>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-outline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] border-outline text-zinc-300 hover:text-white hover:bg-surface-hover"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] font-semibold bg-brand-gold text-brand-dark hover:bg-brand-gold/90 px-5 text-xs"
            >
              {isSubmitting ? "Creando..." : "Crear Sucursal"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface EditBranchModalProps {
  branch: BranchAdminItem;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: UpdateBranchInput) => void;
  isSubmitting: boolean;
}

export function EditBranchModal({
  branch,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: EditBranchModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });
  const [name, setName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address ?? "");
  const [openingHours, setOpeningHours] = useState(branch.openingHours ?? "");
  const [phone, setPhone] = useState(branch.phone ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(branch.whatsappNumber ?? "");
  const [isActive, setIsActive] = useState(branch.isActive);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const whatsappValidation = validateWhatsapp(whatsappNumber, false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    if (whatsappNumber.trim() && !whatsappValidation.isValid) {
      setError(whatsappValidation.error || "Formato de WhatsApp inválido.");
      return;
    }

    setError(null);
    onSubmit({
      name: name.trim(),
      address: address.trim() || null,
      openingHours: openingHours.trim() || null,
      phone: phone.trim() || null,
      whatsappNumber: whatsappValidation.normalized,
      isActive,
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-branch-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-outline bg-surface-card p-6 shadow-2xl text-white overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="flex sm:hidden justify-center items-center -mt-2 pb-3">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600" />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-zinc-400 hover:bg-surface-hover hover:text-white"
          aria-label="Cerrar modal"
        >
          <X className="size-5" />
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
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
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
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-branch-hours" className="block text-xs font-semibold text-zinc-300 mb-1">
              Horarios de Atención
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <input
                id="edit-branch-hours"
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="Ej. Lun a Sáb 9:00 a 13:00 y 16:30 a 20:30"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface pl-10 pr-3.5 text-xs text-white placeholder:text-zinc-500 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>
            <span className="mt-1 block text-[11px] text-zinc-500">
              Visible para los clientes en el catálogo web y selección de sucursal.
            </span>
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
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
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
                placeholder="Ej. 11 4450-1001 o 5491144501001"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface px-3.5 font-mono text-xs text-white placeholder:text-zinc-400 caret-brand-gold focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none"
              />
            </div>
          </div>

          {whatsappNumber.trim() ? (
            <div
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border text-xs",
                whatsappValidation.isValid
                  ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/25 text-amber-300"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageCircle className="size-4 shrink-0 text-emerald-400" />
                <span className="truncate font-mono text-[11px]">
                  {whatsappValidation.isValid
                    ? `wa.me/${whatsappValidation.normalized} (${formatDisplayWhatsapp(whatsappNumber)})`
                    : whatsappValidation.error}
                </span>
              </div>
              {whatsappValidation.isValid && (
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0">
                  Válido
                </span>
              )}
            </div>
          ) : (
            <span className="block text-[11px] text-zinc-500">
              Podés ingresar el celular con o sin código de país (ej. 11 4450-1001 o 011-15...). Se normalizará automáticamente.
            </span>
          )}

          {/* Active status toggle */}
          <div className="flex items-center justify-between rounded-xl border border-outline bg-surface p-3.5">
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

          <div className="flex justify-end gap-2 pt-2 border-t border-outline">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] border-outline text-zinc-300 hover:text-white hover:bg-surface-hover"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] font-semibold bg-brand-gold text-brand-dark hover:bg-brand-gold/90 px-5 text-xs"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
