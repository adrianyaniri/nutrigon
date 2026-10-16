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
          login: async () => {},
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

    const saveButtons = screen.getAllByRole("button", { name: "Guardar precio" });
    fireEvent.click(saveButtons[0]!);

    expect(
      await screen.findByText(/Precio y estado actualizados para "Almendras Nonpareil"/i)
    ).toBeInTheDocument();
  });

  it("opens the offer modal, validates promotional price < regular price, and activates an offer", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");

    // Click "Oferta" button on the first item (Almendras Nonpareil)
    const offerButtons = screen.getAllByRole("button", { name: /^Oferta$/i });
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
});
