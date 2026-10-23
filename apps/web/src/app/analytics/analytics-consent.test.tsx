import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsConsent } from "./analytics-consent";

const analytics = vi.hoisted(() => ({
  acceptAnalytics: vi.fn(),
  rejectAnalytics: vi.fn(),
  trackPageView: vi.fn(),
  getAnalyticsConsent: vi.fn<() => "accepted" | "rejected" | null>(() => null),
  isAnalyticsAvailable: vi.fn(() => true),
}));

vi.mock("./posthog", () => analytics);

describe("AnalyticsConsent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    analytics.getAnalyticsConsent.mockReturnValue(null);
    analytics.isAnalyticsAvailable.mockReturnValue(true);
  });
  afterEach(cleanup);

  it("requires an explicit choice before tracking and supports revocation", () => {
    render(<AnalyticsConsent />);
    expect(analytics.acceptAnalytics).not.toHaveBeenCalled();
    expect(analytics.trackPageView).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar analítica" }));
    expect(analytics.acceptAnalytics).toHaveBeenCalledOnce();
    expect(analytics.trackPageView).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /Preferencias de analítica/ }));
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));
    expect(analytics.rejectAnalytics).toHaveBeenCalledOnce();
  });

  it("does not show a consent banner when analytics is unconfigured", () => {
    analytics.isAnalyticsAvailable.mockReturnValue(false);
    render(<AnalyticsConsent />);
    expect(
      screen.queryByRole("region", { name: "Preferencias de analítica" })
    ).toBeNull();
  });
});
