import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { branchPricingRepository } from "@/features/pricing/data/branch-pricing-repository";
import { INITIAL_MOCK_ITEMS } from "@/features/pricing/data/branch-pricing.mock";
import type { BranchProductAdminItem } from "@/features/pricing/data/branch-pricing-repository";
import { AuthContext } from "@/features/auth/context/auth-context";
import { Role } from "@/features/auth/types";
import { AdminProductsPage } from "./admin-products-page";

const [baseItem] = INITIAL_MOCK_ITEMS;
if (!baseItem) throw new Error("Expected a branch product fixture");

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
          login: async () => ({}) as never,
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
  afterEach(() => vi.restoreAllMocks());

  it("switches WEIGHT price input between 100 g and 1 kg without changing the canonical price", async () => {
    const item: BranchProductAdminItem = {
      ...baseItem,
      priceReferenceGrams: 1000,
      price: 16000,
      promotionalPrice: null,
      isOnSale: false,
    };
    vi.spyOn(branchPricingRepository, "listProducts").mockResolvedValue({
      items: [item],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const save = vi.spyOn(branchPricingRepository, "upsertProduct").mockResolvedValue({
      id: "bp",
      branchId: "b-centro",
      productId: item.productId,
      price: 16000,
      promotionalPrice: null,
      isOnSale: false,
      isAvailable: true,
      isFeatured: false,
    });

    renderAdminProductsPage();

    const input = await screen.findByLabelText("Precio de Almendras Nonpareil");
    const selector = screen.getByLabelText("Unidad de precio de Almendras Nonpareil");
    expect(input).toHaveValue("16000");
    expect(selector).toHaveValue("1000");
    expect(screen.getByText(/Precio por 100 g:.*1\.600/)).toBeInTheDocument();
    expect(screen.getByText(/Precio por 1 kg:.*16\.000/)).toBeInTheDocument();

    fireEvent.change(selector, { target: { value: "100" } });
    expect(input).toHaveValue("1600");
    expect(screen.getByText("Precio por 100 g")).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar precio de Almendras Nonpareil" })
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.any(String),
        item.productId,
        expect.any(String),
        expect.objectContaining({ price: 16000 })
      )
    );
  });

  it("does not reprice an unchanged rounded per100g reference", async () => {
    const item: BranchProductAdminItem = { ...baseItem, priceReferenceGrams: 100, price: 100.01 };
    vi.spyOn(branchPricingRepository, "listProducts").mockResolvedValue({
      items: [item],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const save = vi
      .spyOn(branchPricingRepository, "upsertProduct")
      .mockResolvedValue({
        id: "bp",
        branchId: "b-centro",
        productId: item.productId,
        price: 100.01,
        promotionalPrice: null,
        isOnSale: false,
        isAvailable: true,
        isFeatured: true,
      });
    renderAdminProductsPage();
    expect(await screen.findByLabelText("Precio de Almendras Nonpareil")).toHaveValue(
      "10"
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar precio de Almendras Nonpareil" })
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.any(String),
        item.productId,
        expect.any(String),
        expect.objectContaining({ price: 100.01 })
      )
    );
  });
  it("enters regular and offer prices per100g but saves canonical kg amounts", async () => {
    const item: BranchProductAdminItem = {
      ...baseItem,
      priceReferenceGrams: 100,
      price: 10500,
      promotionalPrice: null,
      isOnSale: false,
    };
    const list = vi
      .spyOn(branchPricingRepository, "listProducts")
      .mockResolvedValue({ items: [item], total: 1, page: 1, limit: 20, totalPages: 1 });
    const record = {
      id: "bp",
      branchId: "b-centro",
      productId: item.productId,
      price: 11002.5,
      promotionalPrice: null,
      isOnSale: false,
      isAvailable: true,
      isFeatured: true,
    };
    const save = vi
      .spyOn(branchPricingRepository, "upsertProduct")
      .mockResolvedValue(record);
    const offer = vi
      .spyOn(branchPricingRepository, "updateOffer")
      .mockResolvedValue({ ...record, isOnSale: true, promotionalPrice: 9005 });
    renderAdminProductsPage();
    const input = await screen.findByLabelText("Precio de Almendras Nonpareil");
    expect(input).toHaveValue("1050");
    expect(screen.getByText("Granel · Precio por 100 g")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "1100.25" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar precio de Almendras Nonpareil" })
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.any(String),
        item.productId,
        expect.any(String),
        expect.objectContaining({ price: 11002.5 })
      )
    );
    fireEvent.click(screen.getByRole("button", { name: /oferta/i }));
    fireEvent.change(screen.getByLabelText(/Precio promocional de oferta/), {
      target: { value: "900.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activar oferta" }));
    await waitFor(() =>
      expect(offer).toHaveBeenCalledWith(
        expect.any(String),
        item.productId,
        expect.any(String),
        expect.objectContaining({ promotionalPrice: 9005 })
      )
    );
    list.mockRestore();
    save.mockRestore();
    offer.mockRestore();
  });
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

  it("activates an offer only for the selected weight", async () => {
    const item: BranchProductAdminItem = {
      ...baseItem,
      price: 1000,
      weightOptionsGrams: [100, 250, 500, 1000],
      promotionalPrice: null,
      weightOffers: [],
      isOnSale: false,
    };
    vi.spyOn(branchPricingRepository, "listProducts").mockResolvedValue({
      items: [item],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    const updateOffer = vi.spyOn(branchPricingRepository, "updateOffer").mockResolvedValue({
      id: "bp",
      branchId: "b-centro",
      productId: item.productId,
      price: 1000,
      promotionalPrice: null,
      isOnSale: true,
      isAvailable: true,
      isFeatured: false,
    });

    renderAdminProductsPage();
    await screen.findByText(item.name);
    fireEvent.click(screen.getByRole("button", { name: /oferta/i }));
    fireEvent.click(screen.getByRole("radio", { name: "Gramajes específicos" }));
    for (const weight of [100, 500, 1000]) {
      fireEvent.change(screen.getByLabelText(`Precio promocional para ${weight === 1000 ? "1 kg" : `${weight} g`}`), {
        target: { value: "0" },
      });
    }
    fireEvent.change(screen.getByLabelText("Precio promocional para 250 g"), {
      target: { value: "125" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Activar oferta" }));

    await waitFor(() =>
      expect(updateOffer).toHaveBeenCalledWith(
        expect.any(String),
        item.productId,
        expect.any(String),
        {
          isOnSale: true,
          promotionalPrice: null,
          weightOffers: [{ weightGrams: 250, promotionalPrice: 125 }],
        }
      )
    );
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
      await screen.findByText(
        /Precio y estado actualizados para "Nueces Mariposa Extra Light"/i
      )
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
            login: async () => ({}) as never,
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
    expect(
      screen.queryByLabelText("Precio de Almendras Nonpareil")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /guardar precio/i })
    ).not.toBeInTheDocument();
  });

  it("shows dirty state and allows reverting price to original value", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");
    const priceInput = screen.getByLabelText("Precio de Almendras Nonpareil");

    // Modify price
    fireEvent.change(priceInput, { target: { value: "19500" } });

    expect(screen.getByText(/· Sin guardar/i)).toBeInTheDocument();
    const revertBtn = screen.getByRole("button", {
      name: /Revertir precio de Almendras Nonpareil/i,
    });
    expect(revertBtn).toBeInTheDocument();

    // Revert changes
    fireEvent.click(revertBtn);
    expect(screen.queryByText(/· Sin guardar/i)).not.toBeInTheDocument();
  });

  it("sanitizes Argentine decimal comma into period in price input", async () => {
    renderAdminProductsPage();

    await screen.findByText("Almendras Nonpareil");
    const priceInput = screen.getByLabelText(
      "Precio de Almendras Nonpareil"
    ) as HTMLInputElement;

    fireEvent.change(priceInput, { target: { value: "17200,50" } });
    expect(priceInput.value).toBe("17200.50");
  });
});
