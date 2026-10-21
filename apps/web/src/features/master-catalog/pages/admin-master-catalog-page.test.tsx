import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { masterCatalogRepository } from "../data/master-catalog-repository";
import { AuthContext } from "@/features/auth/context/auth-context";
import { Role } from "@/features/auth/types";
import { AdminMasterCatalogPage } from "./admin-master-catalog-page";

function renderMasterCatalogPage(role: Role = Role.ADMIN_GENERAL) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user: {
            id: role === Role.ADMIN_GENERAL ? "u-admin-general" : "u-branch-origone",
            email:
              role === Role.ADMIN_GENERAL
                ? "admin@nutrigon.com"
                : "admin.origone@nutrigon.com",
            fullName:
              role === Role.ADMIN_GENERAL ? "Administrador General" : "Encargado Origone",
            role,
            branchId: role === Role.ADMIN_GENERAL ? null : "b-origone",
          },
          token: "mock-jwt-token-general",
          selectedBranchSlug: "origone",
          setSelectedBranchSlug: () => {},
          isLoading: false,
          isAuthenticated: true,
          login: async () => ({}) as never,
          logout: () => {},
        }}
      >
        <MemoryRouter initialEntries={["/admin/catalogo-maestro"]}>
          <AdminMasterCatalogPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("AdminMasterCatalogPage (Master Catalog & Categories)", () => {
  afterEach(() => vi.restoreAllMocks());
  it("creates a spice product using editable small-quantity defaults", async () => {
    const create = vi.spyOn(masterCatalogRepository, "createProduct");
    renderMasterCatalogPage();
    await screen.findByText("Almendras Nonpareil");
    fireEvent.click(screen.getByRole("button", { name: /Nuevo Producto Maestro/i }));
    fireEvent.change(screen.getByLabelText(/Nombre del Producto/), {
      target: { value: "Canela configurada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cantidades pequeñas" }));
    expect(screen.getByLabelText("Cantidades disponibles (g)")).toHaveValue(
      "25, 50, 75, 100"
    );
    fireEvent.change(screen.getByLabelText("Referencia del precio"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear Producto Maestro" }));
    await screen.findByText(/Producto maestro "Canela configurada" creado/);
    expect(create).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        weightOptionsGrams: [25, 50, 75, 100],
        defaultWeightGrams: 25,
        priceReferenceGrams: 100,
      })
    );
    const card = screen
      .getByRole("heading", { name: "Canela configurada" })
      .closest("article")!;
    fireEvent.click(within(card).getByRole("button", { name: "Editar" }));
    expect(screen.getByLabelText("Cantidades disponibles (g)")).toHaveValue(
      "25, 50, 75, 100"
    );
    expect(screen.getByLabelText("Peso seleccionado inicialmente (g)")).toHaveValue(25);
    expect(screen.getByLabelText("Referencia del precio")).toHaveValue("100");
    create.mockRestore();
  });

  it("does not submit when the initial weight is outside the available list", async () => {
    const create = vi.spyOn(masterCatalogRepository, "createProduct");
    renderMasterCatalogPage();
    await screen.findByText("Almendras Nonpareil");
    fireEvent.click(screen.getByRole("button", { name: /Nuevo Producto Maestro/i }));
    fireEvent.change(screen.getByLabelText(/Nombre del Producto/), {
      target: { value: "Especia inválida" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cantidades pequeñas" }));
    fireEvent.change(screen.getByLabelText("Peso seleccionado inicialmente (g)"), {
      target: { value: "250" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear Producto Maestro" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/peso inicial incluido/);
    expect(create).not.toHaveBeenCalled();
  });
  it("restricts access for non-general admins (BRANCH_ADMIN)", async () => {
    renderMasterCatalogPage(Role.BRANCH_ADMIN);

    expect(
      await screen.findByRole("heading", {
        name: /Acceso exclusivo para Administración General/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /Ir a Precios y Ofertas de mi Sucursal/i })
    ).toBeInTheDocument();
  });

  it("renders master catalog header, metrics, and products list for ADMIN_GENERAL", async () => {
    renderMasterCatalogPage(Role.ADMIN_GENERAL);

    expect(
      await screen.findByRole("heading", {
        name: /Catálogo Maestro de Productos/i,
      })
    ).toBeInTheDocument();

    expect(await screen.findByText("Almendras Nonpareil")).toBeInTheDocument();
    expect(screen.getByText("Nueces Mariposa Extra Light")).toBeInTheDocument();
    expect(screen.getByText("Categorías Maestras")).toBeInTheDocument();
  });

  it("opens create product modal, creates a master product and shows feedback banner", async () => {
    renderMasterCatalogPage(Role.ADMIN_GENERAL);

    await screen.findByText("Almendras Nonpareil");

    const newProductBtn = screen.getByRole("button", {
      name: /Nuevo Producto Maestro/i,
    });
    fireEvent.click(newProductBtn);

    expect(
      await screen.findByRole("heading", { name: /Nuevo Producto Maestro/i })
    ).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByLabelText(/Nombre del Producto \*/i);
    fireEvent.change(nameInput, { target: { value: "Mix Frutos Rojos Deshidratados" } });

    const codeInput = screen.getByLabelText(/Código Interno/i);
    fireEvent.change(codeInput, { target: { value: "FR-090" } });

    const saveBtn = screen.getByRole("button", { name: "Crear Producto Maestro" });
    fireEvent.click(saveBtn);

    expect(
      await screen.findByText(/Producto maestro "Mix Frutos Rojos Deshidratados" creado/i)
    ).toBeInTheDocument();

    expect(screen.getByText("Mix Frutos Rojos Deshidratados")).toBeInTheDocument();
  });

  it("opens create category modal and creates a new master category", async () => {
    renderMasterCatalogPage(Role.ADMIN_GENERAL);

    await screen.findByText("Almendras Nonpareil");

    const newCategoryBtn = screen.getByRole("button", {
      name: /Nueva Categoría/i,
    });
    fireEvent.click(newCategoryBtn);

    expect(
      await screen.findByRole("heading", { name: /Nueva Categoría Maestra/i })
    ).toBeInTheDocument();

    const catNameInput = screen.getByLabelText(/Nombre de la Categoría \*/i);
    fireEvent.change(catNameInput, { target: { value: "Especias & Condimentos" } });

    const saveCatBtn = screen.getByRole("button", { name: "Guardar Categoría" });
    fireEvent.click(saveCatBtn);

    expect(
      await screen.findByText(/Categoría "Especias & Condimentos" creada exitosamente/i)
    ).toBeInTheDocument();
  });

  it("allows editing an existing master category", async () => {
    renderMasterCatalogPage(Role.ADMIN_GENERAL);

    await screen.findByText("Almendras Nonpareil");

    const categoryModalBtn = screen.getByRole("button", {
      name: /Nueva Categoría|Gestionar Categorías/i,
    });
    fireEvent.click(categoryModalBtn);

    const dialog = await screen.findByRole("dialog");
    const listTab = within(dialog).getByRole("tab", { name: /Lista de Categorías/i });
    fireEvent.click(listTab);

    const editBtn = within(dialog).getByRole("button", {
      name: "Editar categoría Frutos Secos",
    });
    fireEvent.click(editBtn);

    expect(
      await screen.findByRole("heading", { name: /Editar Categoría Maestra/i })
    ).toBeInTheDocument();

    const catNameInput = within(dialog).getByLabelText(/Nombre de la Categoría \*/i);
    fireEvent.change(catNameInput, { target: { value: "Frutos Secos Premium" } });

    const saveCatBtn = within(dialog).getByRole("button", { name: "Guardar Categoría" });
    fireEvent.click(saveCatBtn);

    expect(
      await screen.findByText(
        /Categoría "Frutos Secos Premium" actualizada exitosamente/i
      )
    ).toBeInTheDocument();
  });

  it("toggles product active status between Activar and Desactivar", async () => {
    renderMasterCatalogPage(Role.ADMIN_GENERAL);

    await screen.findByText("Almendras Nonpareil");

    const deactivateBtn = screen.getAllByRole("button", { name: "Desactivar" })[0];
    expect(deactivateBtn).toBeInTheDocument();
    fireEvent.click(deactivateBtn!);

    expect(
      await screen.findByText(/fue desactivado en el catálogo maestro/i)
    ).toBeInTheDocument();
  });

  it("allows browsing category list and editing category directly without mode dropdown", async () => {
    renderMasterCatalogPage(Role.ADMIN_GENERAL);

    await screen.findByText("Almendras Nonpareil");
    await screen.findByText(/Gestionar Categorías \([1-9]/);

    // Click on the summary pill or category button
    const summaryBtn = screen.getByRole("button", {
      name: /Ver y editar categorías maestras/i,
    });
    fireEvent.click(summaryBtn);

    const dialog = await screen.findByRole("dialog");

    // Switch to list tab
    const listTab = within(dialog).getByRole("tab", { name: /Lista de Categorías/i });
    fireEvent.click(listTab);

    // See category within dialog list
    expect(within(dialog).getByText("Harinas & Granos")).toBeInTheDocument();

    // Click direct edit button on Harinas & Granos
    const editBtn = within(dialog).getByRole("button", {
      name: "Editar categoría Harinas & Granos",
    });
    fireEvent.click(editBtn);

    // Form opens pre-filled
    expect(within(dialog).getByDisplayValue("Harinas & Granos")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("harinas-granos")).toBeInTheDocument();

    // Change name
    const catNameInput = within(dialog).getByLabelText(/Nombre de la Categoría \*/i);
    fireEvent.change(catNameInput, { target: { value: "Harinas y Cereales" } });

    // Submit
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar Categoría" }));

    expect(
      await screen.findByText(/Categoría "Harinas y Cereales" actualizada exitosamente/i)
    ).toBeInTheDocument();
  });

  it("allows deleting a master category from the edit view without redundant navigation buttons", async () => {
    renderMasterCatalogPage(Role.ADMIN_GENERAL);

    await screen.findByText("Almendras Nonpareil");

    const summaryBtn = screen.getByRole("button", {
      name: /Ver y editar categorías maestras/i,
    });
    fireEvent.click(summaryBtn);

    const dialog = await screen.findByRole("dialog");

    // Switch to list tab
    const listTab = within(dialog).getByRole("tab", { name: /Lista de Categorías/i });
    fireEvent.click(listTab);

    // Ensure there is only 1 access to "Nueva Categoría" (the tab itself, no duplicate button in list)
    expect(
      within(dialog).queryByRole("button", { name: "Nueva Categoría" })
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("tab", { name: /Nueva Categoría/i })
    ).toBeInTheDocument();

    // Click edit on Suplementos
    const editBtn = within(dialog).getByRole("button", {
      name: "Editar categoría Suplementos",
    });
    fireEvent.click(editBtn);

    // Ensure redundant "Ver Lista" button is not rendered in the form footer
    expect(
      within(dialog).queryByRole("button", { name: /Ver Lista/i })
    ).not.toBeInTheDocument();

    // Click Eliminar Categoría
    const deleteBtn = within(dialog).getByRole("button", { name: /Eliminar Categoría/i });
    fireEvent.click(deleteBtn);

    expect(
      await screen.findByText(/Categoría "Suplementos" eliminada exitosamente/i)
    ).toBeInTheDocument();
  });
});
