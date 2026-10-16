import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { Role } from "../types";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecoveryHint, setShowRecoveryHint] = useState(false);

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
      const user = await login({ email: trimmedEmail, password }, rememberMe);

      // Intelligent redirect based on role and intended destination
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

      if (user.role === Role.ADMIN_GENERAL) {
        // ADMIN_GENERAL should always land on /admin/catalogo-maestro,
        // unless explicitly trying to access a general admin destination like /admin/sucursales
        const isGeneralRoute =
          from && (from.includes("catalogo-maestro") || from.includes("sucursales"));
        navigate(isGeneralRoute ? from : "/admin/catalogo-maestro", { replace: true });
      } else {
        // BRANCH_ADMIN should land on /admin/productos (or safe branch routes like /admin/combos)
        const isRestrictedForBranch =
          from && (from.includes("catalogo-maestro") || from.includes("sucursales"));
        const target =
          from && !isRestrictedForBranch && from !== "/admin"
            ? from
            : "/admin/productos";
        navigate(target, { replace: true });
      }
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
    <div className="relative flex min-h-dvh flex-col justify-between bg-background text-foreground font-body antialiased selection:bg-brand-gold selection:text-brand-dark overflow-x-hidden">
      {/* Ambient Subtle Wheat-Gold Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-40 motion-reduce:hidden" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-b from-brand-gold/15 via-brand-gold/5 to-transparent blur-[120px] rounded-full" />
      </div>

      {/* Top Minimalist Utility Bar */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full overflow-hidden ring-2 ring-brand-gold/60 bg-brand-surface shadow-xs">
            <img src="/Logo.jpeg" alt="" width="32" height="32" className="size-full object-cover" />
          </span>
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-sm tracking-tight text-foreground">
              Nutrigon
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-muted/80 text-muted-foreground font-mono font-medium border border-border/40">
              POS &amp; Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 text-xs font-medium">
          <div className="flex items-center gap-2 bg-muted/50 px-2.5 sm:px-3 py-1 rounded-full border border-border">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="text-muted-foreground text-[11px] sm:text-xs">
              Red Operativa Conectada
            </span>
          </div>

          <a
            href="mailto:soporte@nutrigon.com"
            className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-brand-gold transition-colors text-xs"
          >
            <Headphones className="size-3.5" aria-hidden="true" />
            <span>Soporte TI</span>
          </a>
        </div>
      </header>

      {/* Central Login Canvas */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px] bg-card border border-border rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm transition-all duration-300">
          {/* Card Header & Brand Identity */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative inline-flex items-center justify-center size-16 rounded-full overflow-hidden ring-2 ring-brand-gold/60 bg-brand-surface shadow-lg mb-3.5">
              <img src="/Logo.jpeg" alt="" width="64" height="64" className="size-full object-cover" />
            </div>
            <h1 className="font-headline text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1">
              Nutrigon <span className="text-brand-gold font-normal">·</span> Dietética &amp; Cerealera
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-normal">
              Acceso al Panel de Gestión
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email / User Input */}
            <div>
              <label
                htmlFor="usernameInput"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Email o Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
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
                  className="w-full bg-muted/30 text-foreground text-sm rounded-xl pl-10 pr-4 py-3 border border-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-muted-foreground/50 min-h-[44px]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="passwordInput"
                className="block text-xs font-semibold text-foreground mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
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
                  className="w-full bg-muted/30 text-foreground text-sm rounded-xl pl-10 pr-11 py-3 border border-border focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none transition-all placeholder:text-muted-foreground/50 min-h-[44px]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-brand-gold transition-colors min-h-[44px] min-w-[44px] justify-center"
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
                  className="size-4 rounded bg-muted/50 border-border text-brand-gold focus:ring-brand-gold focus:ring-offset-card transition-colors"
                />
                <span className="text-xs text-muted-foreground">Recordar sesión</span>
              </label>
              <button
                type="button"
                onClick={() => setShowRecoveryHint((prev) => !prev)}
                className="text-xs text-muted-foreground hover:text-brand-gold transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Password Recovery In-Context Notification */}
            {showRecoveryHint && (
              <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 p-3 text-xs text-foreground flex items-start gap-2 animate-in fade-in duration-200">
                <Info className="size-4 text-brand-gold shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Para restablecer tu clave o gestionar permisos de sucursal, comunicate con el Administrador General o escribí a soporte@nutrigon.com.
                </span>
              </div>
            )}

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
              className="w-full min-h-[48px] bg-brand-gold hover:bg-brand-gold-hover active:scale-[0.99] disabled:opacity-60 text-brand-dark font-headline font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/20 mt-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
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
          <div className="mt-7 pt-5 border-t border-border/60 flex items-center justify-center gap-2 text-[11px] text-muted-foreground text-center">
            <ShieldCheck className="size-3.5 text-brand-gold shrink-0" aria-hidden="true" />
            <span>Conexión cifrada de extremo a extremo · Control de acceso por roles</span>
          </div>
        </div>

        {/* Auxiliary Links Outside the Card */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-8 text-xs text-muted-foreground">
          <Link
            to="/catalogo"
            className="hover:text-brand-gold transition-colors flex items-center gap-1.5 font-medium min-h-[44px] sm:min-h-0"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Volver al Catálogo Público</span>
          </Link>
          <span className="hidden sm:inline-block text-border" aria-hidden="true">
            •
          </span>
          <span className="font-mono text-[11px]">Nutrigon v1.0 · Sistema Seguro</span>
        </div>
      </main>

      {/* Clean Desktop/Mobile Footer */}
      <footer className="relative z-10 w-full px-4 sm:px-8 py-4 sm:py-5 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span>© {new Date().getFullYear()} Nutrigon Dietética &amp; Cerealera. Todos los derechos reservados.</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-[11px] sm:text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" /> SSL 256-Bit TLS 1.3
          </span>
          <span className="font-mono text-muted-foreground/80 uppercase">
            Autenticación Centralizada
          </span>
        </div>
      </footer>
    </div>
  );
}
