import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CatalogLandingPage } from "./catalog-landing-page";

function renderLandingPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/"]}>
        <CatalogLandingPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CatalogLandingPage (Public Storefront Landing)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders Nutrigon branding, title, and admin access button", async () => {
    renderLandingPage();

    expect(screen.getAllByText("Nutrigon").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dietética & Cerealera/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Elegí tu sucursal más cercana/i)).toBeInTheDocument();

    const adminLink = screen.getByRole("link", { name: /Acceso Gestión/i });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute("href", "/admin");

    // Wait for async branches query to settle
    await screen.findByRole("heading", { name: /Sucursal (Centro|Origone)/i });
  });

  it("renders branches and opens the QR modal when clicking the QR button", async () => {
    renderLandingPage();

    expect(
      await screen.findByRole("heading", { name: /Sucursal (Centro|Origone)/i })
    ).toBeInTheDocument();

    // Click on the first QR button once branches are rendered
    const qrButtons = await screen.findAllByRole("button", { name: /QR/i });
    expect(qrButtons.length).toBeGreaterThan(0);

    fireEvent.click(qrButtons[0]!);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/QR Catálogo Sucursal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Copiar enlace/i })).toBeInTheDocument();
  });
});
