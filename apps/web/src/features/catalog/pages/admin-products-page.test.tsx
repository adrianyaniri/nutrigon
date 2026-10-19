import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/features/auth/context/auth-context";
import { Role } from "@/features/auth/types";
import { AdminProductsPage } from "./admin-products-page";

function renderAdminProductsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user: {
            id: "u-branch-origone",
            email: "admin.origone@nutrigon.com",
            fullName: "Encargado Origone",
            role: Role.BRANCH_ADMIN,
            branchId: "b-centro",
          },
          token: "mock-jwt-token-origone",
          selectedBranchSlug: "centro",
          setSelectedBranchSlug: () => {},
          isLoading: false,
          isAuthenticated: true,
          login: async () => ({} as never),
          logout: () => {},
        }}
      >
        <MemoryRouter initialEntries={["/admin/productos"]}>
          <AdminProductsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("AdminProductsPage (Branch Pricing & Offers)", () => {
  it("renders branch products, status filter tabs, and explicit unit labels", async () => {
    renderAdminProductsPage();

    expect(
      await screen.findByRole("heading", {
        name: /Gestión de Precios y Ofertas por Sucursal/i,
      })
    ).toBeInTheDocument();

    expect(await screen.findByText("Almendras Nonpareil")).toBeInTheDocument();
    expect(screen.getByText("Nueces Mariposa Extra Light")).toBeInTheDocument();
    expect(screen.getAllByText("Granel · Precio por 1 kg").length).toBeGreaterThan(0);
  });

  it("updates a product price when entering a new value and clicking Guardar precio", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");
    const priceInput = screen.getByLabelText("Precio de Almendras Nonpareil");
    fireEvent.change(priceInput, { target: { value: "15900" } });

    const saveButtons = screen.getAllByRole("button", { name: /guardar precio/i });
    fireEvent.click(saveButtons[0]!);

    expect(
      await screen.findByText(/Precio y estado actualizados para "Almendras Nonpareil"/i)
    ).toBeInTheDocument();
  });

  it("opens the offer modal, validates promotional price < regular price, and activates an offer", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");

    // Click "Oferta" button on the first item (Almendras Nonpareil)
    const offerButtons = screen.getAllByRole("button", { name: /oferta/i });
    fireEvent.click(offerButtons[0]!);

    expect(
      await screen.findByRole("dialog", { name: "Almendras Nonpareil" })
    ).toBeInTheDocument();

    const promoInput = screen.getByLabelText(/Precio promocional de oferta/i);

    // Invalid promo price >= regular price
    fireEvent.change(promoInput, { target: { value: "25000" } });
    fireEvent.click(screen.getByRole("button", { name: "Activar oferta" }));

    expect(
      await screen.findByText(/El precio promocional debe ser menor al precio regular/i)
    ).toBeInTheDocument();

    // Valid promo price
    fireEvent.change(promoInput, { target: { value: "12900" } });
    fireEvent.click(screen.getByRole("button", { name: "Activar oferta" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Oferta activada en "Almendras Nonpareil"/i)
      ).toBeInTheDocument();
    });
  });

  it("filters products by En oferta tab", async () => {
    renderAdminProductsPage();

    await screen.findByText("Nueces Mariposa Extra Light");

    const onSaleTab = screen.getByRole("tab", { name: /En oferta/i });
    fireEvent.click(onSaleTab);

    expect(await screen.findByText("Nueces Mariposa Extra Light")).toBeInTheDocument();
  });

  it("toggles product featured status when clicking Destacar button", async () => {
    renderAdminProductsPage();

    await screen.findByText("Nueces Mariposa Extra Light");

    // Click Destacar button for Nueces Mariposa
    const destacarButtons = screen.getAllByRole("button", { name: /destacar/i });
    fireEvent.click(destacarButtons[0]!);

    expect(
      await screen.findByText(/Precio y estado actualizados para "Nueces Mariposa Extra Light"/i)
    ).toBeInTheDocument();
  });

  it("saves product price when pressing Enter inside the price input", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");
    const priceInput = screen.getByLabelText("Precio de Almendras Nonpareil");
    fireEvent.change(priceInput, { target: { value: "16500" } });
    fireEvent.keyDown(priceInput, { key: "Enter" });

    expect(
      await screen.findByText(/Precio y estado actualizados para "Almendras Nonpareil"/i)
    ).toBeInTheDocument();
  });

  it("dismisses offer modal when pressing Escape", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");
    const offerButtons = screen.getAllByRole("button", { name: /oferta/i });
    fireEvent.click(offerButtons[0]!);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("filters branch products by category selector", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");
    await screen.findByRole("option", { name: "Sin TACC" });

    const categorySelect = screen.getByLabelText("Filtrar por categoría");
    fireEvent.change(categorySelect, { target: { value: "c-sin-tacc" } });

    expect(await screen.findByText("Galletas de Arroz Sin TACC")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Almendras Nonpareil")).not.toBeInTheDocument();
    });
  });

  it("renders read-only mode for ADMIN_GENERAL without edit controls", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user: {
              id: "u-admin-general",
              email: "admin.general@nutrigon.com",
              fullName: "Admin General",
              role: Role.ADMIN_GENERAL,
              branchId: null,
            },
            token: "mock-jwt-token-general",
            selectedBranchSlug: "centro",
            setSelectedBranchSlug: () => {},
            isLoading: false,
            isAuthenticated: true,
            login: async () => ({} as never),
            logout: () => {},
          }}
        >
          <MemoryRouter initialEntries={["/admin/productos"]}>
            <AdminProductsPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );

    expect(
      await screen.findByText(/Modo Auditoría de Sucursal \(Solo Lectura\)/i)
    ).toBeInTheDocument();

    expect(await screen.findByText("Almendras Nonpareil")).toBeInTheDocument();
    expect(screen.getAllByText("Solo Lectura").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Precio de Almendras Nonpareil")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /guardar precio/i })).not.toBeInTheDocument();
  });
});
