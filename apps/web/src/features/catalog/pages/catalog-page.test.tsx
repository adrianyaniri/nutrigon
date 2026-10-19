import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

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

  it("renders branch info in footer without catalog switching links", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");

    expect(screen.getByText("Sucursal Sur")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sur" })).not.toBeInTheDocument();
  });

  it("adds UNIT products directly to cart and shows mobile sticky cart dock", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Galletas de Arroz");
    expect(screen.getByRole("button", { name: "Mi pedido, vacío" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Agregar Galletas de Arroz al pedido" }));
    expect(screen.getByRole("button", { name: "Mi pedido, 1 producto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ver pedido: 1 producto/i })).toBeInTheDocument();
  });

  it("opens portion modal when clicking the choose button on WEIGHT products", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");
    expect(screen.getByRole("button", { name: "Mi pedido, vacío" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Elegir gramos de Almendras Nonpareil" }));

    // Modal opens instead of directly adding to cart
    expect(await screen.findByRole("dialog", { name: "Almendras Nonpareil" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Opciones de gramaje" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mi pedido, vacío" })).toBeInTheDocument();

    // Adding from inside the modal updates the cart
    const submitBtn = screen.getByRole("button", { name: /Agregar al Pedido/i });
    fireEvent.click(submitBtn);
    expect(await screen.findByRole("button", { name: "Mi pedido, 1 producto" })).toBeInTheDocument();
  });

  it("opens the cart drawer when clicking the cart button in header", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Galletas de Arroz");

    fireEvent.click(screen.getByRole("button", { name: "Agregar Galletas de Arroz al pedido" }));
    const cartButton = screen.getByRole("button", { name: "Mi pedido, 1 producto" });
    fireEvent.click(cartButton);

    expect(await screen.findByRole("dialog", { name: /tu pedido/i })).toBeInTheDocument();
    expect(screen.getByText("Enviar Pedido por WhatsApp")).toBeInTheDocument();
  });

  it("opens the product detail modal when clicking a product card in the grid", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");

    const heading = screen.getByRole("heading", { name: "Almendras Nonpareil" });
    fireEvent.click(heading);

    expect(await screen.findByRole("dialog", { name: "Almendras Nonpareil" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Opciones de gramaje" })).toBeInTheDocument();
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

  it("shows QR instruction on branch not found view without branch switching buttons", async () => {
    renderPage("/catalogo/inexistente");
    expect(await screen.findByText("Sucursal no encontrada")).toBeInTheDocument();
    expect(screen.getByText(/La sucursal "inexistente" no existe/)).toBeInTheDocument();
    expect(screen.getByText(/Acceso exclusivo mediante código QR de cada sucursal/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ir a Sucursal/i })).not.toBeInTheDocument();
  });

  it("renders QR instruction and institutional branch directory when visiting /catalogo root", async () => {
    renderPage("/catalogo");
    expect(await screen.findByText("Escaneá el código QR en tu sucursal")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Sucursal Centro" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver Catálogo/i })).not.toBeInTheDocument();
  });

  it("displays a read-only branch badge in header so customers cannot switch branches without QR", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");

    // Static badge is present, not an interactive button
    expect(screen.getByLabelText("Sucursal actual: Centro")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sucursal actual: Centro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Seleccionar Sucursal" })).not.toBeInTheDocument();
  });

  it("renders CatalogHero with branch name on root view and hides it when filtering", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");

    // Hero is visible
    expect(screen.getByRole("region", { name: "Presentación de Nutrigon" })).toBeInTheDocument();
    expect(screen.getByText("Comé rico, sano y a tu medida.")).toBeInTheDocument();
    expect(screen.getByText(/Precios y disponibilidad para Sucursal Centro/)).toBeInTheDocument();

    // When searching, hero collapses
    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar productos" }), {
      target: { value: "quinoa" },
    });
    expect(screen.queryByRole("region", { name: "Presentación de Nutrigon" })).not.toBeInTheDocument();
  });

  it("filters category directly via mobile CategoryChips dock without opening drawer", async () => {
    renderPage("/catalogo/centro");
    await screen.findByText("Almendras Nonpareil");

    // Click the "Suplementos" chip in CategoryChips navigation
    const categoryNavs = screen.getAllByRole("navigation", { name: "Categorías" });
    const mobileChipsNav = categoryNavs[1] ?? categoryNavs[0]!;
    const suplementosChip = within(mobileChipsNav).getByRole("button", { name: /suplementos/i });
    fireEvent.click(suplementosChip);

    // Filter applied directly without opening modal drawer
    expect(await screen.findByText("Colágeno Hidrolizado")).toBeInTheDocument();
    expect(screen.queryByText("Almendras Nonpareil")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Categorías" })).not.toBeInTheDocument();
  });
});
