import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
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

  it("renders Nutrigon branding, QR access instructions, and admin access button", async () => {
    renderLandingPage();

    expect(screen.getAllByText("Nutrigon").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dietética & Cerealera/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Escaneá el código QR en tu sucursal/i)).toBeInTheDocument();

    const adminLink = screen.getByRole("link", { name: /Acceso Gestión/i });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute("href", "/admin");

    // Wait for async branches query to settle
    await screen.findByRole("heading", { name: /Sucursal (Centro|Origone)/i });
  });

  it("renders institutional branch directory with maps links and without catalog switching buttons", async () => {
    renderLandingPage();

    expect(
      await screen.findByRole("heading", { name: /Sucursal (Centro|Origone)/i })
    ).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /Cómo llegar/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Ver Catálogo/i })).not.toBeInTheDocument();
  });
});
