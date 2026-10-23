import { beforeEach, describe, expect, it, vi } from "vitest";
import { envConfig } from "@/app/config/env";

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  has_opted_out_capturing: vi.fn(() => false),
  startSessionRecording: vi.fn(),
  stopSessionRecording: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: sdk }));
vi.mock("@/app/config/env", () => ({
  envConfig: {
    env: {
      VITE_APP_ENV: "test",
      VITE_POSTHOG_KEY: "test-public-token",
      VITE_POSTHOG_HOST: "https://us.i.posthog.com",
    },
  },
}));

import {
  acceptAnalytics,
  captureAnalyticsEvent,
  getAnalyticsConsent,
  rejectAnalytics,
  isPublicAnalyticsHostname,
  sanitizeAnalyticsUrl,
  stopAnalyticsRecording,
  trackPageView,
} from "./posthog";

describe("privacy-first analytics", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("does not initialize or capture without consent", () => {
    expect(getAnalyticsConsent()).toBeNull();
    trackPageView("/catalogo/centro?search=private");
    captureAnalyticsEvent("product_viewed", { product_id: "p-1" });
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.capture).not.toHaveBeenCalled();
  });

  it("removes query strings and fragments from URLs", () => {
    expect(
      sanitizeAnalyticsUrl("https://example.com/catalogo/centro?name=Ana#secret")
    ).toBe("https://example.com/catalogo/centro");
  });

  it("excludes local and IP-literal hosts from production analytics", () => {
    expect(isPublicAnalyticsHostname("localhost")).toBe(false);
    expect(isPublicAnalyticsHostname("catalog.localhost")).toBe(false);
    expect(isPublicAnalyticsHostname("169.254.4.7")).toBe(false);
    expect(isPublicAnalyticsHostname("192.168.1.3")).toBe(false);
    expect(isPublicAnalyticsHostname("[fd00::1]")).toBe(false);
    expect(isPublicAnalyticsHostname("[fe80::1]")).toBe(false);
    expect(isPublicAnalyticsHostname("www.nutrigon.ar")).toBe(true);
  });

  it("persists rejection without initializing analytics", () => {
    rejectAnalytics();
    expect(getAnalyticsConsent()).toBe("rejected");
    expect(sdk.init).not.toHaveBeenCalled();
  });

  it("remains inactive when PostHog configuration is missing", () => {
    const previousKey = envConfig.env.VITE_POSTHOG_KEY;
    envConfig.env.VITE_POSTHOG_KEY = undefined;
    acceptAnalytics();
    trackPageView("/catalogo/centro");
    expect(sdk.init).not.toHaveBeenCalled();
    expect(sdk.capture).not.toHaveBeenCalled();
    envConfig.env.VITE_POSTHOG_KEY = previousKey;
  });

  it("captures route changes and re-entry without StrictMode duplicates", async () => {
    acceptAnalytics();
    const config = sdk.init.mock.calls[0]?.[1];
    expect(config.session_recording).toMatchObject({
      maskAllInputs: true,
      maskTextSelector: "*",
      recordBody: false,
      recordHeaders: false,
    });
    expect(
      config.session_recording.maskCapturedNetworkRequestFn({
        name: "https://example.com/orders?name=Ana",
        requestBody: "private",
      })
    ).toMatchObject({ name: "https://example.com", requestBody: undefined });
    const event = config.before_send({
      event: "product_viewed",
      properties: {
        product_id: "p-1",
        customerName: "Ana",
        $current_url: "https://example.com/?name=Ana",
      },
    });
    expect(event.properties).not.toHaveProperty("customerName");
    expect(event.properties.$current_url).not.toContain("name=Ana");
    const snapshot = config.before_send({
      event: "$snapshot",
      properties: {
        $snapshot_data: { type: 3 },
        $session_id: "session-1",
        $current_url: "https://example.com/catalogo?phone=123",
        $session_entry_url: "https://example.com/?phone=123",
        $referrer: "https://example.com/?name=Ana",
        utm_campaign: "private",
      },
    });
    expect(snapshot.properties.$snapshot_data).toEqual({ type: 3 });
    expect(snapshot.properties.$current_url).toBe(`${window.location.origin}/`);
    expect(snapshot.properties).not.toHaveProperty("$session_entry_url");
    expect(snapshot.properties).not.toHaveProperty("$referrer");
    expect(snapshot.properties).not.toHaveProperty("utm_campaign");
    trackPageView("/catalogo/centro?search=first");
    trackPageView("/catalogo/centro?search=second");
    stopAnalyticsRecording();
    trackPageView("/catalogo/centro");
    expect(sdk.capture).toHaveBeenCalledTimes(1);
    expect(sdk.capture).toHaveBeenCalledWith("$pageview", {
      $current_url: expect.stringMatching(/\/catalogo\/centro$/),
    });
    trackPageView("/catalogo/sur");
    expect(sdk.capture).toHaveBeenCalledTimes(2);
    stopAnalyticsRecording();
    await new Promise((resolve) => setTimeout(resolve, 0));
    trackPageView("/catalogo/sur");
    expect(sdk.capture).toHaveBeenCalledTimes(3);
  });
});
