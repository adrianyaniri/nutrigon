import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";

interface BranchOption {
  slug: string;
  name: string;
}

const BRANCHES: readonly BranchOption[] = [
  { slug: "centro", name: "Sucursal Centro" },
  { slug: "norte", name: "Sucursal Norte" },
  { slug: "sur", name: "Sucursal Sur" },
];

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, selectedBranchSlug, setSelectedBranchSlug } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Por favor, ingresá tu email o usuario.");
      return;
    }
    if (!password) {
      setErrorMessage("Por favor, ingresá tu contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: trimmedEmail, password }, rememberMe);

      // Redirect to previous intended page or default to admin catalog
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
      navigate(from || "/admin/productos", { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Ocurrió un error inesperado al intentar acceder.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col justify-between bg-surface text-foreground font-body antialiased selection:bg-brand-gold selection:text-surface overflow-x-hidden">
      {/* Ambient Subtle Wheat-Gold Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-40" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-b from-brand-gold/15 via-brand-gold/5 to-transparent blur-[120px] rounded-full" />
      </div>

      {/* Top Minimalist Utility Bar */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-white/[0.04] bg-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="size-8 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold shadow-sm">
            <Store className="size-4" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-sm tracking-tight text-white">
              Nutrigon
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white/[0.06] text-white/70 font-mono font-medium">
              POS &amp; Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium">
          <div className="flex items-center gap-2 bg-surface-card/80 px-2.5 sm:px-3 py-1 rounded-full border border-white/[0.06]">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="text-white/80 text-[11px] sm:text-xs">
              Red Operativa Conectada
            </span>
          </div>

          <a
            href="mailto:soporte@nutrigon.com"
            className="hidden sm:flex items-center gap-1.5 text-white/60 hover:text-brand-gold transition-colors text-xs"
          >
            <Headphones className="size-3.5" aria-hidden="true" />
            <span>Soporte TI</span>
          </a>
        </div>
      </header>

      {/* Central Login Canvas */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] bg-surface-card border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm transition-all duration-300">
          {/* Card Header & Brand Identity */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center size-14 sm:size-16 rounded-2xl bg-brand-gold/10 border border-brand-gold/25 mb-3.5 shadow-[0_0_24px_rgba(245,183,49,0.12)]">
              <Store className="size-7 sm:size-8 text-brand-gold" aria-hidden="true" />
            </div>
            <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-white mb-1">
              Nutrigon <span className="text-brand-gold font-normal">·</span> Dietética &amp; Cerealera
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted font-normal">
              Acceso al Panel de Gestión
            </p>
          </div>

          {/* Point of Sale Branch Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">
                Seleccionar Punto de Venta
              </label>
              <span className="text-[11px] text-brand-gold font-medium flex items-center gap-1 bg-brand-gold/10 px-2 py-0.5 rounded-full border border-brand-gold/20">
                <RefreshCw className="size-3 animate-spin" style={{ animationDuration: "8s" }} />
                Sincronizado
              </span>
            </div>

            <div
              className="grid grid-cols-3 p-1 bg-[#111215] border border-white/[0.06] rounded-xl gap-1"
              role="radiogroup"
              aria-label="Selección de sucursal activa"
            >
              {BRANCHES.map((branch) => {
                const isSelected = selectedBranchSlug === branch.slug;
                return (
                  <button
                    key={branch.slug}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedBranchSlug(branch.slug)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-150 min-h-[38px] ${
                      isSelected
                        ? "bg-white/[0.1] text-white border border-brand-gold/50 shadow-sm shadow-black/40 font-semibold"
                        : "text-white/60 hover:text-white border border-transparent"
                    }`}
                  >
                    <MapPin
                      className={`size-3.5 shrink-0 ${
                        isSelected ? "text-brand-gold" : "opacity-60"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{branch.name.replace("Sucursal ", "")}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email / User Input */}
            <div>
              <label
                htmlFor="usernameInput"
                className="block text-xs font-medium text-white/80 mb-1.5"
              >
                Email o Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/35">
                  <User className="size-4" aria-hidden="true" />
                </div>
                <input
                  id="usernameInput"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nutrigon.com"
                  required
                  className="w-full bg-[#111215] text-white text-sm rounded-xl pl-10 pr-4 py-3 border border-white/[0.08] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-white/25 min-h-[44px]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="passwordInput"
                className="block text-xs font-medium text-white/80 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/35">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
                <input
                  id="passwordInput"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#111215] text-white text-sm rounded-xl pl-10 pr-11 py-3 border border-white/[0.08] focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-white/25 min-h-[44px]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-brand-gold transition-colors min-h-[44px] min-w-[44px] justify-center"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Options Row: Remember & Forgot Password */}
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded bg-[#111215] border-white/20 text-brand-gold focus:ring-brand-gold focus:ring-offset-surface-card transition-colors"
                />
                <span className="text-xs text-white/70">Recordar sesión</span>
              </label>
              <button
                type="button"
                onClick={() =>
                  alert("Para restablecer la clave, contactá al Administrador General o a soporte@nutrigon.com.")
                }
                className="text-xs text-white/50 hover:text-brand-gold transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Dynamic Error Feedback Message */}
            {errorMessage && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200 animate-in fade-in-50 duration-200"
              >
                <AlertCircle className="size-4 shrink-0 text-red-400" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="submitBtn"
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] bg-brand-gold hover:bg-brand-gold-hover active:scale-[0.99] disabled:opacity-60 text-stone-950 font-headline font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>Verificando acceso...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Panel</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Security Trust Line */}
          <div className="mt-7 pt-5 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-white/50 text-center">
            <ShieldCheck className="size-3.5 text-brand-gold shrink-0" aria-hidden="true" />
            <span>Conexión cifrada de extremo a extremo · Sucursales sincronizadas</span>
          </div>
        </div>

        {/* Auxiliary Links Outside the Card */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-8 text-xs text-white/40">
          <Link
            to="/catalogo"
            className="hover:text-brand-gold transition-colors flex items-center gap-1.5 font-medium min-h-[44px] sm:min-h-0"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Volver al Catálogo Público</span>
          </Link>
          <span className="hidden sm:inline-block text-white/10" aria-hidden="true">
            •
          </span>
          <span className="font-mono text-[11px]">Nutrigon v1.0 · Sistema Seguro</span>
        </div>
      </main>

      {/* Clean Desktop/Mobile Footer */}
      <footer className="relative z-10 w-full px-4 sm:px-8 py-4 sm:py-5 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span>© 2025 Nutrigon Dietética &amp; Cerealera. Todos los derechos reservados.</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1 text-white/50">
            <Lock className="size-3" aria-hidden="true" /> SSL 256-Bit TLS 1.3
          </span>
          <span className="font-mono text-white/40 uppercase">
            Terminal ID: POS-{selectedBranchSlug.toUpperCase()}-01
          </span>
        </div>
      </footer>
    </div>
  );
}
