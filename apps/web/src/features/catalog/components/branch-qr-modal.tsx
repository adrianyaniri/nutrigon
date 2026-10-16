import { useEffect, useState } from "react";
import { Check, Copy, Download, Printer, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export interface BranchQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: {
    name: string;
    slug: string;
    address?: string;
  };
}

export function BranchQrModal({ isOpen, onClose, branch }: BranchQrModalProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [pngDataUrl, setPngDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const branchUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/catalogo/${branch.slug}`
      : `https://nutrigon.pages.dev/catalogo/${branch.slug}`;

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    // Generate crisp SVG for visual display and printing
    QRCode.toString(branchUrl, {
      type: "svg",
      margin: 2,
      width: 280,
      color: {
        dark: "#121316",
        light: "#FFFFFF",
      },
    })
      .then((svg) => {
        if (isMounted) setSvgContent(svg);
      })
      .catch((err) => {
        console.error("Failed to generate SVG QR code", err);
      });

    // Generate PNG Data URL for download
    QRCode.toDataURL(branchUrl, {
      margin: 2,
      width: 512,
      color: {
        dark: "#121316",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        if (isMounted) setPngDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error("Failed to generate PNG QR code", err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, branchUrl]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCopyLink() {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(branchUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Nutrigon - QR Sucursal ${branch.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 40px;
              text-align: center;
              color: #121316;
              background-color: #fff;
            }
            .card {
              border: 3px solid #121316;
              border-radius: 24px;
              padding: 48px;
              max-width: 480px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            }
            .brand {
              font-size: 32px;
              font-weight: 800;
              letter-spacing: -0.5px;
              margin-bottom: 4px;
            }
            .sub {
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              color: #a87932;
              letter-spacing: 2px;
              margin-bottom: 24px;
            }
            .branch-title {
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .address {
              font-size: 14px;
              color: #666;
              margin-bottom: 28px;
            }
            .qr-wrapper {
              display: flex;
              justify-content: center;
              margin: 0 auto 28px auto;
            }
            .qr-wrapper svg {
              width: 260px;
              height: 260px;
              border-radius: 12px;
            }
            .instructions {
              font-size: 16px;
              font-weight: 600;
              line-height: 1.4;
              color: #222;
              margin-bottom: 12px;
            }
            .url {
              font-family: monospace;
              font-size: 12px;
              color: #888;
            }
            @media print {
              body { padding: 0; }
              .card { border: 2px solid #000; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">Nutrigon</div>
            <div class="sub">Dietética & Cerealera</div>
            <div class="branch-title">Sucursal ${branch.name}</div>
            ${branch.address ? `<div class="address">${branch.address}</div>` : ""}
            <div class="qr-wrapper">
              ${svgContent}
            </div>
            <div class="instructions">Escaneá con tu celular para ver nuestro catálogo online y pedir por WhatsApp</div>
            <div class="url">${branchUrl}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200 motion-reduce:animate-none"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8 text-foreground motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ventana de código QR"
          className="absolute right-3.5 top-3.5 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-gold/15 border border-brand-gold/30 text-brand-gold mb-3">
            <QrCode className="size-6" />
          </div>
          <h2 id="qr-modal-title" className="font-headline text-lg sm:text-xl font-bold text-foreground">
            QR Catálogo Sucursal {branch.name}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Escaneá con la cámara para acceder al catálogo y hacer pedidos en esta sucursal.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-white p-5 shadow-inner">
          {svgContent ? (
            <div
              className="size-56 sm:size-60 flex items-center justify-center [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="size-56 sm:size-60 flex items-center justify-center text-zinc-400 text-xs">
              Generando código QR...
            </div>
          )}
          <span className="mt-2 text-[11px] font-mono font-medium text-zinc-800 break-all text-center">
            {branchUrl}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5 border-border bg-muted/30 text-foreground hover:bg-muted/70 hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-4 text-emerald-400" />
                  <span>¡Enlace copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="size-4 text-brand-gold" />
                  <span>Copiar enlace</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              disabled={!svgContent}
              className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5 border-border bg-muted/30 text-foreground hover:bg-muted/70 hover:text-foreground"
            >
              <Printer className="size-4 text-brand-gold" />
              <span>Imprimir cartel</span>
            </Button>
          </div>

          {pngDataUrl && (
            <a
              href={pngDataUrl}
              download={`nutrigon-qr-${branch.slug}.png`}
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand-gold text-brand-dark text-xs font-bold shadow-md hover:bg-brand-gold-hover transition-colors"
            >
              <Download className="size-4" />
              <span>Descargar QR (Imagen PNG)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
