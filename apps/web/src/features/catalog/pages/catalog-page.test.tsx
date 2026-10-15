import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CartProvider } from "@/features/cart";
import { CatalogLandingPage } from "./catalog-landing-page";
import { CatalogPage } from "./catalog-page";

function renderPage(initialEntry = "/catalogo/centro") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CartProvider>
          <Routes>
            <Route path="/catalogo" element={<CatalogLandingPage />} />
            <Route path="/catalogo/:branchSlug" element={<CatalogPage />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("CatalogPage & Route-based Branching", () => {
  it("renders products of the specified branch route", async () => {
    renderPage("/catalogo/centro");
    expect(await screen.findByText("Almendras Nonpareil")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Todos los productos");
    expect(screen.getByText(/en Sucursal Centro/)).toBeInTheDocument();
  });

  it("filters by search term and offers to clear filters when nothing matches", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar productos" }), {
      target: { value: "quinoa" },
    });
    expect(screen.getByText("Quinoa Real")).toBeInTheDocument();
    expect(screen.queryByText("Almendras Nonpareil")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar productos" }), {
      target: { value: "zzzz" },
    });
    expect(screen.getByText("No encontramos productos")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quitar filtros" }));
    expect(await screen.findByText("Almendras Nonpareil")).toBeInTheDocument();
  });

  it("navigates to another branch via footer links and updates availability", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");
    // Pistachos are sold in Centro but not in Sur.
    expect(screen.getByText("Pistachos Tostados")).toBeInTheDocument();

    // Click link to "Sur" in footer
    const surLink = screen.getByRole("link", { name: "Sur" });
    fireEvent.click(surLink);

    expect(await screen.findByText(/en Sucursal Sur/)).toBeInTheDocument();
    expect(screen.queryByText("Pistachos Tostados")).not.toBeInTheDocument();
  });

  it("reflects added products in the cart button", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");
    expect(screen.getByRole("button", { name: "Mi pedido, vacío" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Agregar Almendras Nonpareil al pedido" }));
    expect(screen.getByRole("button", { name: "Mi pedido, 1 producto" })).toBeInTheDocument();
  });

  it("applies the category from the URL", async () => {
    renderPage("/catalogo/centro?categoria=suplementos");
    expect(await screen.findByText("Colágeno Hidrolizado")).toBeInTheDocument();
    expect(screen.queryByText("Almendras Nonpareil")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Suplementos");
    const nav = screen.getAllByRole("navigation", { name: "Categorías" })[0]!;
    expect(within(nav).getAllByRole("button").length).toBeGreaterThan(1);
  });

  it("opens mobile category drawer and selects a category", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");

    // Click "Categorías" drawer trigger on mobile
    const drawerTrigger = screen.getByRole("button", { name: "Abrir menú de categorías" });
    fireEvent.click(drawerTrigger);

    // Verify modal drawer is open
    expect(await screen.findByRole("dialog", { name: "Categorías" })).toBeInTheDocument();

    // Select "Suplementos" inside drawer
    const drawer = screen.getByRole("dialog", { name: "Categorías" });
    const suplementosOption = within(drawer).getByRole("button", { name: /suplementos/i });
    fireEvent.click(suplementosOption);

    // Verify filter applied
    expect(await screen.findByText("Colágeno Hidrolizado")).toBeInTheDocument();
    expect(screen.queryByText("Almendras Nonpareil")).not.toBeInTheDocument();
  });

  it("shows branch not found view when navigating to an invalid branch slug", async () => {
    renderPage("/catalogo/inexistente");
    expect(await screen.findByText("Sucursal no encontrada")).toBeInTheDocument();
    expect(screen.getByText(/La sucursal "inexistente" no existe/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ir a Sucursal Centro/i })).toBeInTheDocument();
  });

  it("renders branch selection landing page when visiting /catalogo root", async () => {
    renderPage("/catalogo");
    expect(await screen.findByText("Elegí tu sucursal más cercana")).toBeInTheDocument();
    expect(await screen.findByText("Ver Catálogo Centro")).toBeInTheDocument();
    expect(screen.getByText("Ver Catálogo Norte")).toBeInTheDocument();
    expect(screen.getByText("Ver Catálogo Sur")).toBeInTheDocument();
  });
});
