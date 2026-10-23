import { useState } from "react";
import {
  acceptAnalytics,
  getAnalyticsConsent,
  isAnalyticsAvailable,
  rejectAnalytics,
  trackPageView,
} from "./posthog";

export function AnalyticsConsent() {
  const [consent, setConsent] = useState(getAnalyticsConsent);
  const [isOpen, setIsOpen] = useState(consent === null);

  if (!isAnalyticsAvailable()) return null;

  function accept() {
    acceptAnalytics();
    trackPageView(window.location.pathname);
    setConsent("accepted");
    setIsOpen(false);
  }

  function reject() {
    rejectAnalytics();
    setConsent("rejected");
    setIsOpen(false);
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="Preferencias de analítica"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto w-auto max-w-xl rounded-2xl border border-border bg-card p-4 shadow-xl md:bottom-6 md:p-5"
        >
          <h2 className="text-sm font-bold text-foreground">Tu privacidad importa</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Con tu permiso, usamos analítica y grabaciones de sesión para mejorar el
            catálogo. Ocultamos textos y campos, y no enviamos el mensaje de WhatsApp.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={reject}
              className="min-h-[44px] rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={accept}
              className="min-h-[44px] rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Aceptar analítica
            </button>
          </div>
        </section>
      )}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-3 z-40 min-h-[44px] rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-md md:bottom-6"
          aria-label={`Preferencias de analítica: ${consent === "accepted" ? "aceptada" : "rechazada"}`}
        >
          Privacidad
        </button>
      )}
    </>
  );
}
