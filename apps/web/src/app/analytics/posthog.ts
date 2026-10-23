import posthog from "posthog-js";
import { envConfig } from "@/app/config/env";

const CONSENT_KEY = "nutrigon:analytics-consent";
type Consent = "accepted" | "rejected";
type AnalyticsEvent =
  "product_viewed" | "add_to_cart" | "checkout_started" | "whatsapp_checkout_clicked";
type EventProperties = {
  product_id?: string;
  product_category?: string;
  quantity?: number;
  cart_items_count?: number;
};

let initialized = false;
let lastPagePath: string | null = null;
let recordingActive = false;
let transientConsent: Consent | null = null;
let pendingPageReset: ReturnType<typeof setTimeout> | null = null;

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" || pathname === "/catalogo" || pathname.startsWith("/catalogo/")
  );
}

export function isPublicAnalyticsHostname(hostname: string): boolean {
  // Exclude all IP literals and local domains, not just familiar private ranges.
  return !/(^localhost$|\.localhost$|\.local$|^[\d.]+$|:)/i.test(hostname);
}

function canUseAnalytics(): boolean {
  const { VITE_POSTHOG_KEY, VITE_POSTHOG_HOST, VITE_APP_ENV } = envConfig.env;
  if (!VITE_POSTHOG_KEY || !VITE_POSTHOG_HOST) return false;
  if (import.meta.env.MODE === "test") return true;
  return (
    import.meta.env.PROD &&
    VITE_APP_ENV === "production" &&
    isPublicAnalyticsHostname(window.location.hostname)
  );
}

export function isAnalyticsAvailable(): boolean {
  return canUseAnalytics();
}

export function getAnalyticsConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return transientConsent;
  }
}

function saveConsent(value: Consent): void {
  transientConsent = value;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // If storage is unavailable, consent applies only to this page load.
  }
}

export function sanitizeAnalyticsUrl(value: string): string {
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return window.location.origin;
  }
}

function initialize(): void {
  if (initialized || !canUseAnalytics() || !isPublicPath(window.location.pathname))
    return;
  const { VITE_POSTHOG_KEY, VITE_POSTHOG_HOST } = envConfig.env;
  if (!VITE_POSTHOG_KEY || !VITE_POSTHOG_HOST) return;

  try {
    posthog.init(VITE_POSTHOG_KEY, {
      api_host: VITE_POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      capture_heatmaps: false,
      rageclick: false,
      disable_surveys: true,
      person_profiles: "never",
      opt_out_capturing_by_default: true,
      opt_out_persistence_by_default: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "*",
        recordBody: false,
        recordHeaders: false,
        maskCapturedNetworkRequestFn: (request) => {
          if (request.name) {
            const sanitized = sanitizeAnalyticsUrl(request.name);
            request.name =
              sanitized.startsWith(window.location.origin + "/catalogo") ||
              sanitized === window.location.origin + "/"
                ? sanitized
                : new URL(sanitized).origin;
          }
          request.requestBody = undefined;
          request.responseBody = undefined;
          request.requestHeaders = undefined;
          request.responseHeaders = undefined;
          return request;
        },
      },
      before_send: (event) => {
        if (!isPublicPath(window.location.pathname)) return null;
        if (event.event === "$snapshot") {
          const props = event.properties ?? {};
          for (const key of Object.keys(props)) {
            if (/(url|referrer|utm_|gclid|fbclid|msclkid)/i.test(key))
              delete props[key];
          }
          event.properties = {
            ...props,
            $current_url: sanitizeAnalyticsUrl(window.location.href),
          };
          return event;
        }
        const allowedEvents = new Set([
          "$pageview",
          "product_viewed",
          "add_to_cart",
          "checkout_started",
          "whatsapp_checkout_clicked",
        ]);
        if (!allowedEvents.has(event.event)) return null;
        const props = event.properties ?? {};
        event.properties = {
          token: props.token,
          distinct_id: props.distinct_id,
          $session_id: props.$session_id,
          $window_id: props.$window_id,
          $current_url: sanitizeAnalyticsUrl(window.location.href),
          ...(typeof props.product_id === "string"
            ? { product_id: props.product_id }
            : {}),
          ...(typeof props.product_category === "string"
            ? { product_category: props.product_category }
            : {}),
          ...(typeof props.quantity === "number" ? { quantity: props.quantity } : {}),
          ...(typeof props.cart_items_count === "number"
            ? { cart_items_count: props.cart_items_count }
            : {}),
        };
        return event;
      },
    });
    initialized = true;
    posthog.opt_in_capturing({ captureEventName: false });
    recordingActive = true;
  } catch {
    // Analytics must never prevent catalog browsing or checkout.
  }
}

export function startAnalyticsIfConsented(): void {
  if (pendingPageReset !== null) {
    clearTimeout(pendingPageReset);
    pendingPageReset = null;
  }
  if (getAnalyticsConsent() !== "accepted") return;
  if (!initialized) initialize();
  else if (canUseAnalytics() && isPublicPath(window.location.pathname)) {
    try {
      if (posthog.has_opted_out_capturing())
        posthog.opt_in_capturing({ captureEventName: false });
      if (!recordingActive) {
        posthog.startSessionRecording();
        recordingActive = true;
      }
    } catch {
      // Analytics is optional.
    }
  }
}

export function acceptAnalytics(): void {
  saveConsent("accepted");
  startAnalyticsIfConsented();
}

export function rejectAnalytics(): void {
  saveConsent("rejected");
  if (pendingPageReset !== null) clearTimeout(pendingPageReset);
  pendingPageReset = null;
  lastPagePath = null;
  if (initialized) {
    try {
      posthog.stopSessionRecording();
      posthog.opt_out_capturing();
    } catch {
      // A failed analytics SDK must not block the privacy control.
    }
    recordingActive = false;
  }
}

export function stopAnalyticsRecording(): void {
  if (initialized && recordingActive) {
    try {
      posthog.stopSessionRecording();
    } catch {
      // Recording is best effort.
    }
  }
  recordingActive = false;
  // StrictMode immediately remounts effects; a real route exit survives this tick.
  if (pendingPageReset !== null) clearTimeout(pendingPageReset);
  pendingPageReset = setTimeout(() => {
    lastPagePath = null;
    pendingPageReset = null;
  }, 0);
}

export function trackPageView(pathname: string): void {
  startAnalyticsIfConsented();
  const path = pathname.split(/[?#]/, 1)[0] ?? pathname;
  if (!initialized || !isPublicPath(path) || lastPagePath === path) return;
  lastPagePath = path;
  try {
    posthog.capture("$pageview", { $current_url: `${window.location.origin}${path}` });
  } catch {
    // A failed analytics SDK must not affect navigation.
  }
}

export function captureAnalyticsEvent(
  event: AnalyticsEvent,
  properties: EventProperties
): void {
  if (
    !initialized ||
    getAnalyticsConsent() !== "accepted" ||
    !isPublicPath(window.location.pathname)
  )
    return;
  try {
    posthog.capture(event, properties);
  } catch {
    // A failed analytics SDK must not affect cart or checkout actions.
  }
}
