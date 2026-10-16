import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/features/auth/context/auth-context";
import { Role } from "@/features/auth/types";
import { AdminBranchesPage } from "./admin-branches-page";

function renderBranchesPage(role: Role = Role.ADMIN_GENERAL) {
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
          token: "mock-jwt-token",
          selectedBranchSlug: "origone",
          setSelectedBranchSlug: () => {},
          isLoading: false,
          isAuthenticated: true,
          login: async () => {},
          logout: () => {},
        }}
      >
        <MemoryRouter initialEntries={["/admin/sucursales"]}>
          <AdminBranchesPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("AdminBranchesPage (Branch Management for ADMIN_GENERAL)", () => {
  it("restricts access for non-general admins (BRANCH_ADMIN)", async () => {
    renderBranchesPage(Role.BRANCH_ADMIN);

    expect(
      await screen.findByRole("heading", {
        name: /Acceso Restringido/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Ir a Precios de mi Sucursal/i })
    ).toBeInTheDocument();
  });

  it("renders page header, metrics, and seeded branches for ADMIN_GENERAL", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    expect(
      await screen.findByRole("heading", {
        name: /Sucursales de la Cadena/i,
      })
    ).toBeInTheDocument();

    expect(await screen.findByText(/Sucursal Origone/i)).toBeInTheDocument();
    expect(screen.getByText(/Sucursal Pedro Díaz/i)).toBeInTheDocument();
    expect(screen.getByText(/Sucursal William Morris/i)).toBeInTheDocument();
    expect(screen.getByText("Total de Sucursales")).toBeInTheDocument();
    expect(screen.getByText("Sucursales Activas")).toBeInTheDocument();
  });

  it("filters branches by search query", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const searchInput = screen.getByPlaceholderText(
      /Buscar por nombre, dirección o WhatsApp/i
    );
    fireEvent.change(searchInput, { target: { value: "Morris" } });

    expect(screen.getByText(/Sucursal William Morris/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sucursal Origone/i)).not.toBeInTheDocument();
  });

  it("opens create branch modal and creates a new branch", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const createBtn = screen.getByRole("button", { name: /Nueva Sucursal/i });
    fireEvent.click(createBtn);

    expect(
      await screen.findByRole("heading", { name: "Nueva Sucursal" })
    ).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/Ej. Morón, Castelar, Ramos Mejía/i);
    fireEvent.change(nameInput, { target: { value: "Castelar Norte" } });

    const phoneInput = screen.getByPlaceholderText(/Ej. 11-4450-1234/i);
    fireEvent.change(phoneInput, { target: { value: "11-4450-9999" } });

    const whatsappInput = screen.getByPlaceholderText("5491144501234");
    fireEvent.change(whatsappInput, { target: { value: "5491199998888" } });

    const submitBtn = screen.getByRole("button", { name: "Crear Sucursal" });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Sucursal "Castelar Norte" creada exitosamente/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Sucursal Castelar Norte/i)).toBeInTheDocument();
  });

  it("opens edit branch modal and updates contact info", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const editButtons = screen.getAllByRole("button", { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    expect(
      await screen.findByRole("heading", { name: /Editar Sucursal/i })
    ).toBeInTheDocument();

    const addressInput = screen.getByPlaceholderText(/Ej. Av. Vergara 2400/i);
    fireEvent.change(addressInput, { target: { value: "Av. Origone 1234 (Renovada)" } });

    const submitBtn = screen.getByRole("button", { name: "Guardar Cambios" });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/actualizada correctamente/i)
    ).toBeInTheDocument();

    expect(screen.getByText("Av. Origone 1234 (Renovada)")).toBeInTheDocument();
  });

  it("toggles branch active/pause status", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const pauseButtons = screen.getAllByTitle(/Pausar sucursal/i);
    expect(pauseButtons.length).toBeGreaterThan(0);

    fireEvent.click(pauseButtons[0]);

    expect(
      await screen.findByText(/pausada/i)
    ).toBeInTheDocument();
  });
});
