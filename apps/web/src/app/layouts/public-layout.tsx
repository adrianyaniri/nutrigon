import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CartProvider } from "@/features/cart";
import { AnalyticsConsent } from "@/app/analytics/analytics-consent";
import { stopAnalyticsRecording, trackPageView } from "@/app/analytics/posthog";

/** Layout for the public storefront; owns state shared across public pages (cart). */
export function PublicLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  useEffect(() => () => stopAnalyticsRecording(), []);

  return (
    <CartProvider>
      <Outlet />
      <AnalyticsConsent />
    </CartProvider>
  );
}
