import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
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
            email: role === Role.ADMIN_GENERAL ? "admin@nutrigon.com" : "admin.origone@nutrigon.com",
            fullName: role === Role.ADMIN_GENERAL ? "Administrador General" : "Encargado Origone",
            role,
            branchId: role === Role.ADMIN_GENERAL ? null : "b-origone",
          },
          token: "mock-jwt-token-general",
          selectedBranchSlug: "origone",
          setSelectedBranchSlug: () => {},
          isLoading: false,
          isAuthenticated: true,
          login: async () => ({} as never),
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
      name: /Nueva Categoría/i,
    });
    fireEvent.click(categoryModalBtn);

    const modeSelect = await screen.findByLabelText(/Acción sobre Categorías/i);
    fireEvent.change(modeSelect, { target: { value: "c-frutos-secos" } });

    expect(
      await screen.findByRole("heading", { name: /Editar Categoría Maestra/i })
    ).toBeInTheDocument();

    const catNameInput = screen.getByLabelText(/Nombre de la Categoría \*/i);
    fireEvent.change(catNameInput, { target: { value: "Frutos Secos Premium" } });

    const saveCatBtn = screen.getByRole("button", { name: "Guardar Categoría" });
    fireEvent.click(saveCatBtn);

    expect(
      await screen.findByText(/Categoría "Frutos Secos Premium" actualizada exitosamente/i)
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
});
