import { useEffect, useState } from "react";
import { Check, Copy, Download, Printer, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { useDialogFocusTrap } from "@/hooks";
import { getPublicCatalogUrl } from "../lib/public-catalog-url";

export interface BranchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: { name: string; slug: string; address?: string | null };
}

export function BranchQrModal({ isOpen, onClose, branch }: BranchQrModalProps) {
  const modalRef = useDialogFocusTrap<HTMLDivElement>({ isOpen, onClose });
  const [svgContent, setSvgContent] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const branchUrl = getPublicCatalogUrl(branch.slug);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const options = {
      margin: 2,
      width: 512,
      color: { dark: "#121316", light: "#FFFFFF" },
    };
    void QRCode.toString(branchUrl, { ...options, type: "svg", width: 280 }).then(
      (svg) => {
        if (mounted) setSvgContent(svg);
      }
    );
    void QRCode.toDataURL(branchUrl, options).then((dataUrl) => {
      if (mounted) setPngDataUrl(dataUrl);
    });
    return () => {
      mounted = false;
    };
  }, [isOpen, branchUrl]);

  if (!isOpen) return null;

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.title = `Nutrigon - QR Sucursal ${branch.name}`;
    printWindow.document.body.innerHTML = `<main><h1>Nutrigon</h1><h2>Sucursal ${branch.name}</h2>${branch.address ? `<p>${branch.address}</p>` : ""}<div>${svgContent}</div><p>${branchUrl}</p></main>`;
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard?.writeText(branchUrl);
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
      aria-labelledby="qr-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-xs sm:items-center sm:p-4"
    >
      <div
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 text-foreground shadow-2xl sm:rounded-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de código QR"
          className="absolute right-3.5 top-3.5 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/40 bg-muted/30"
        >
          <X className="size-5" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl border border-brand-gold/30 bg-brand-gold/15 text-brand-gold">
            <QrCode className="size-6" />
          </div>
          <h2 id="qr-modal-title" className="font-headline text-lg font-bold sm:text-xl">
            QR Catálogo Sucursal {branch.name}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Escaneá con la cámara para acceder al catálogo y hacer pedidos en esta
            sucursal.
          </p>
        </div>
        <div className="mt-6 flex flex-col items-center rounded-2xl bg-white p-5 shadow-inner">
          {svgContent ? (
            <div
              className="flex size-56 items-center justify-center [&>svg]:size-full sm:size-60"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex size-56 items-center justify-center text-xs text-zinc-400 sm:size-60">
              Generando código QR…
            </div>
          )}
          <span className="mt-2 break-all text-center font-mono text-[11px] font-medium text-zinc-800">
            {branchUrl}
          </span>
        </div>
        <div className="mt-6 space-y-2.5">
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
              download={`nutrigon-qr-${branch.slug}.png`}
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gold text-xs font-bold text-brand-dark hover:bg-brand-gold-hover"
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
            Imprimir cartel
          </Button>
        </div>
      </div>
    </div>
  );
}
