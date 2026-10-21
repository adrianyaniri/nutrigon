import { useEffect, useState } from "react";
import { ArrowRight, Copy, MapPin, QrCode, Share2, Shield, Store } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CatalogFooter } from "../components/catalog-footer";
import { BranchQrModal } from "../components/branch-qr-modal";
import { useBranches } from "../hooks/use-catalog-queries";
import { getPublicCatalogUrl } from "../lib/public-catalog-url";
import type { CatalogBranch } from "../types";

export function CatalogLandingPage() {
  const navigate = useNavigate();
  const branchesQuery = useBranches();
  const branches = branchesQuery.data ?? [];
  const [lastBranchSlug, setLastBranchSlug] = useState<string | null>(null);
  const [qrBranch, setQrBranch] = useState<CatalogBranch | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLastBranchSlug(localStorage.getItem("nutrigon:last-branch"));
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, []);

  const lastBranch = branches.find((branch) => branch.slug === lastBranchSlug);

  async function shareCatalog(branch: CatalogBranch) {
    const url = getPublicCatalogUrl(branch.slug);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Catálogo ${branch.name} | Nutrigon`, url });
        return;
      }
      await navigator.clipboard?.writeText(url);
      setCopiedSlug(branch.slug);
      window.setTimeout(() => setCopiedSlug(null), 2500);
    } catch {
      // A cancelled native share must not be presented as an error.
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-surface ring-2 ring-brand-gold/50 shadow-md">
              <img
                src="/Logo.jpeg"
                alt=""
                width="48"
                height="48"
                loading="eager"
                decoding="async"
                className="size-full object-cover"
              />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-headline text-lg font-bold tracking-tight text-foreground md:text-xl">
                Nutrigon
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold-text">
                Dietética &amp; Cerealera
              </span>
            </span>
          </Link>
          <Link
            to="/admin"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:border-brand-gold hover:text-foreground"
            title="Acceso al panel de administración"
          >
            <Shield className="size-3.5 text-brand-gold-text" aria-hidden="true" />
            <span>Acceso Gestión</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col px-4 py-8 md:px-6 md:py-12">
        <section className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold text-brand-gold-text">
            <QrCode className="size-3.5" aria-hidden="true" />
            Catálogos por sucursal
          </div>
          <h1 className="mt-4 font-headline text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Elegí tu sucursal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Cada sucursal tiene catálogo, precios y disponibilidad propios. Elegí la que
            querés consultar o compartí su enlace público.
          </p>
          {lastBranch && (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
              <span className="text-muted-foreground">Última sucursal visitada:</span>
              <span className="font-semibold text-primary">{lastBranch.name}</span>
              <Button
                size="sm"
                className="min-h-[44px] px-3.5 text-xs font-semibold"
                onClick={() => navigate(`/catalogo/${lastBranch.slug}`)}
              >
                Volver al catálogo <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </div>
          )}
        </section>
        <section
          aria-label="Elegí tu sucursal"
          className="mx-auto mt-10 w-full max-w-4xl"
        >
          <h2 className="mb-4 text-center font-headline text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Sucursales
          </h2>
          {branchesQuery.isPending ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="min-h-[230px] animate-pulse rounded-2xl border border-border bg-card p-6 motion-reduce:animate-none"
                >
                  <div className="size-10 rounded-xl bg-muted" />
                  <div className="mt-3 h-5 w-32 rounded bg-muted" />
                  <div className="mt-2 h-10 rounded bg-muted/60" />
                </div>
              ))}
            </div>
          ) : branchesQuery.isError ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive"
            >
              No pudimos cargar las sucursales. Reintentá más tarde.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              {branches.map((branch) => (
                <article
                  key={branch.slug}
                  className="flex min-h-[230px] flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-brand-gold/40"
                >
                  <div>
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold-text">
                      <Store className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 font-headline text-lg font-bold text-foreground">
                      {branch.name}
                    </h3>
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin
                        className="mt-0.5 size-3.5 shrink-0 text-brand-gold-text"
                        aria-hidden="true"
                      />
                      <span>{branch.address ?? "Dirección a confirmar"}</span>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/60 pt-3">
                    <Link
                      to={`/catalogo/${branch.slug}`}
                      className="col-span-2 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      Ver catálogo <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-[44px] px-2 text-xs"
                      onClick={() => void shareCatalog(branch)}
                    >
                      {copiedSlug === branch.slug ? (
                        <>
                          <Copy className="size-3.5" />
                          Enlace copiado
                        </>
                      ) : (
                        <>
                          <Share2 className="size-3.5" />
                          Compartir
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-[44px] px-2 text-xs"
                      onClick={() => setQrBranch(branch)}
                    >
                      <QrCode className="size-3.5" />
                      Código QR
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <CatalogFooter branches={branches} />
      {qrBranch && (
        <BranchQrModal isOpen onClose={() => setQrBranch(null)} branch={qrBranch} />
      )}
    </div>
  );
}
