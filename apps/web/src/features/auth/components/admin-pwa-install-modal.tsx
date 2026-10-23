import { useEffect, useState } from "react";
import { Check, Copy, Download, Printer, Smartphone, X } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { useDialogFocusTrap } from "@/hooks";

export interface AdminPwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_PWA_URL = "https://admin.nutrigon.ar";

export function AdminPwaInstallModal({ isOpen, onClose }: AdminPwaInstallModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({ isOpen, onClose });
  const [svgContent, setSvgContent] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const options = {
      margin: 2,
      width: 512,
      color: { dark: "#121316", light: "#FFFFFF" },
    };

    void QRCode.toString(ADMIN_PWA_URL, { ...options, type: "svg", width: 280 }).then(
      (svg) => {
        if (mounted) setSvgContent(svg);
      }
    );

    void QRCode.toDataURL(ADMIN_PWA_URL, options).then((dataUrl) => {
      if (mounted) setPngDataUrl(dataUrl);
    });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.title = "Nutrigon - Acceso PWA Administrativa";
    printWindow.document.body.innerHTML = `
      <main style="font-family: sans-serif; text-align: center; padding: 2rem;">
        <h1 style="margin-bottom: 0.25rem;">Nutrigon</h1>
        <h2 style="margin-top: 0; color: #4b5563;">Acceso a Panel Administrativo (PWA)</h2>
        <p style="margin: 1.5rem 0 0.5rem; color: #374151;">
          Escaneá este código QR con la cámara de tu celular para ingresar e instalar la aplicación:
        </p>
        <div style="display: flex; justify-content: center; margin: 1.5rem 0;">
          ${svgContent}
        </div>
        <p style="font-family: monospace; font-size: 1.1rem; font-weight: bold; color: #111827;">
          ${ADMIN_PWA_URL}
        </p>
        <div style="margin-top: 2rem; text-align: left; max-width: 420px; margin-left: auto; margin-right: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; font-size: 0.9rem; color: #4b5563;">
          <p><strong>En Android (Chrome):</strong> Tocá menú (⋮) y seleccioná <em>Instalar aplicación</em>.</p>
          <p><strong>En iPhone (Safari):</strong> Tocá <em>Compartir</em> (ícono con flecha) y elegí <em>Agregar a pantalla de inicio</em>.</p>
        </div>
      </main>
    `;
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard?.writeText(ADMIN_PWA_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* Clipboard may be unavailable. */
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-pwa-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-outline bg-surface-card p-6 text-foreground shadow-2xl sm:rounded-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de instalación"
          className="absolute right-3.5 top-3.5 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-outline/40 bg-surface-hover/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl border border-brand-gold/30 bg-brand-gold/15 text-brand-gold">
            <Smartphone className="size-6" />
          </div>
          <h2 id="admin-pwa-modal-title" className="font-headline text-lg font-bold sm:text-xl">
            Instalar PWA Administrativa
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Escaneá con la cámara de tu celular para abrir el acceso administrativo e instalar la aplicación.
          </p>
        </div>

        {/* QR Preview Card */}
        <div className="mt-5 flex flex-col items-center rounded-2xl bg-white p-5 shadow-inner">
          {svgContent ? (
            <div
              className="flex size-52 items-center justify-center [&>svg]:size-full sm:size-56"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex size-52 items-center justify-center text-xs text-zinc-400 sm:size-56">
              Generando código QR…
            </div>
          )}
          <span className="mt-2 break-all text-center font-mono text-xs font-semibold text-zinc-900">
            {ADMIN_PWA_URL}
          </span>
        </div>

        {/* Installation Instructions */}
        <div className="mt-4 rounded-xl border border-outline/60 bg-surface/50 p-3.5 text-xs space-y-2 text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="font-bold text-foreground shrink-0">Android:</span>
            <span>Abrir en Chrome → menú (⋮) → <strong className="text-foreground">Instalar aplicación</strong> o <strong className="text-foreground">Agregar a pantalla principal</strong>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-foreground shrink-0">iPhone:</span>
            <span>Abrir en Safari → botón <strong className="text-foreground">Compartir</strong> (flecha hacia arriba) → <strong className="text-foreground">Agregar a pantalla de inicio</strong>.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleCopyLink()}
            className="min-h-[44px] w-full text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-400" />
                ¡Enlace copiado!
              </>
            ) : (
              <>
                <Copy className="size-4 text-brand-gold" />
                Copiar enlace
              </>
            )}
          </Button>

          {pngDataUrl && (
            <a
              href={pngDataUrl}
              download="nutrigon-admin-pwa-qr.png"
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gold text-xs font-bold text-brand-dark hover:bg-brand-gold-hover transition-colors"
            >
              <Download className="size-4" />
              Descargar QR (Imagen PNG)
            </a>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={!svgContent}
            className="min-h-[44px] w-full text-xs font-semibold"
            onClick={handlePrint}
          >
            <Printer className="size-4 text-brand-gold" />
            Imprimir instructivo
          </Button>
        </div>
      </div>
    </div>
  );
}
