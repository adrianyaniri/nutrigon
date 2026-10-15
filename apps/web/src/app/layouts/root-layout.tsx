import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Store, Menu, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { envConfig } from "@/app/config/env";

export function RootLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight">Nutrigon</span>
              <span className="text-xs text-muted-foreground">Sistema de Gestión</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors min-h-[44px] inline-flex items-center"
            >
              Inicio
            </Link>
            <Link
              to="/catalogo"
              className="text-sm font-semibold text-primary hover:underline transition-colors min-h-[44px] inline-flex items-center"
            >
              Catálogo Público
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {envConfig.isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  Supabase Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="size-3.5" />
                  Modo Local (.env.example)
                </span>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button (min-h-[44px] tactile target) */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              className="min-h-[44px] min-w-[44px]"
            >
              {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="border-b bg-background px-4 py-4 md:hidden">
            <nav className="flex flex-col space-y-3">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center rounded-md px-3 py-2 text-base font-medium hover:bg-muted min-h-[44px]"
              >
                Inicio
              </Link>
              <Link
                to="/catalogo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center rounded-md px-3 py-2 text-base font-semibold text-primary hover:bg-muted min-h-[44px]"
              >
                Catálogo Público
              </Link>
              <div className="px-3 pt-2">
                {envConfig.isSupabaseConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    Supabase Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <ShieldAlert className="size-4" />
                    Supabase no configurado (.env.example)
                  </span>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-6 text-center text-xs text-muted-foreground">
        <div className="w-full max-w-screen-xl mx-auto px-4">
          <p>
            © {new Date().getFullYear()} Nutrigon — Gestión de 3 Sucursales & Catálogo Web
          </p>
        </div>
      </footer>
    </div>
  );
}
