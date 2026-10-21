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

  it("renders Nutrigon branding, branch selection, and admin access button", async () => {
    renderLandingPage();

    expect(screen.getAllByText("Nutrigon").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dietética & Cerealera/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: "Elegí tu sucursal" })
    ).toBeInTheDocument();

    const adminLink = screen.getByRole("link", { name: /Acceso Gestión/i });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute("href", "/admin");

    // Wait for async branches query to settle
    await screen.findByRole("heading", { name: /^(Centro|Origone)$/i });
  });

  it("links each public branch card to its stable catalog route", async () => {
    renderLandingPage();

    expect(
      await screen.findByRole("heading", { name: /^(Centro|Origone)$/i })
    ).toBeInTheDocument();

    expect(screen.getAllByRole("link", { name: /Ver catálogo/i }).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByRole("link", { name: /Ver catálogo/i })[0]).toHaveAttribute(
      "href",
      "/catalogo/centro"
    );
  });
});
