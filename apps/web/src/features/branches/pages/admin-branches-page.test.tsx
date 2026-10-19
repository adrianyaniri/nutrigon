import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuthContext } from "@/features/auth/context/auth-context";
import { Role, type AuthUser } from "@/features/auth/types";
import { resetMockUsersRepository } from "@/features/users/data/users-repository";
import { AdminBranchesPage } from "./admin-branches-page";

function renderBranchesPage(role: Role = Role.ADMIN_GENERAL, setSelectedBranchSlug = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    ...render(
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
            setSelectedBranchSlug,
            isLoading: false,
            isAuthenticated: true,
            login: async () => ({} as unknown as AuthUser),
            logout: () => {},
          }}
        >
          <MemoryRouter initialEntries={["/admin/sucursales"]}>
            <AdminBranchesPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    ),
    setSelectedBranchSlug,
  };
}

describe("AdminBranchesPage (Branch Management for ADMIN_GENERAL)", () => {
  beforeEach(() => {
    resetMockUsersRepository();
  });

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

    const nameInput = screen.getByLabelText(/Nombre de la Sucursal/i);
    fireEvent.change(nameInput, { target: { value: "Castelar Norte" } });

    const phoneInput = screen.getByLabelText(/Teléfono Fijo \/ Local/i);
    fireEvent.change(phoneInput, { target: { value: "11-4450-9999" } });

    const whatsappInput = screen.getByLabelText(/WhatsApp de Pedidos/i);
    fireEvent.change(whatsappInput, { target: { value: "5491199998888" } });

    const submitBtn = screen.getByRole("button", { name: "Crear Sucursal" });
    fireEvent.click(submitBtn);

    const statusBanner = await screen.findByRole("status");
    expect(statusBanner).toHaveTextContent(/creada exitosamente/i);

    expect(screen.getByText(/Sucursal Castelar Norte/i)).toBeInTheDocument();
  });

  it("opens edit branch modal and updates contact info and opening hours", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const editButtons = screen.getAllByRole("button", { name: /Editar/i });
    fireEvent.click(editButtons[0]!);

    expect(
      await screen.findByRole("heading", { name: /Editar Sucursal/i })
    ).toBeInTheDocument();

    const addressInput = screen.getByLabelText(/Dirección Física/i);
    fireEvent.change(addressInput, { target: { value: "Av. Origone 1234 (Renovada)" } });

    const hoursInput = screen.getByLabelText(/Horarios de Atención/i);
    fireEvent.change(hoursInput, { target: { value: "Lun a Vie 8:30 a 20:30" } });

    const whatsappInput = screen.getByLabelText(/WhatsApp de Pedidos/i);
    fireEvent.change(whatsappInput, { target: { value: "011-15-4450-9999" } });

    // Live validation feedback should be visible
    expect(await screen.findByText(/Válido/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Guardar Cambios" });
    fireEvent.click(submitBtn);

    const statusBanner = await screen.findByRole("status");
    expect(statusBanner).toHaveTextContent(/actualizada correctamente/i);

    expect(screen.getByText("Av. Origone 1234 (Renovada)")).toBeInTheDocument();
    expect(screen.getByText("Lun a Vie 8:30 a 20:30")).toBeInTheDocument();
  });

  it("toggles branch active/pause status", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const pauseButtons = screen.getAllByTitle(/Pausar sucursal/i);
    expect(pauseButtons.length).toBeGreaterThan(0);

    fireEvent.click(pauseButtons[0]!);

    const statusBanner = await screen.findByRole("status");
    expect(statusBanner).toHaveTextContent(/Sucursal "Origone" pausada/i);
  });

  it("dismisses create modal when pressing Escape", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const createBtn = screen.getByRole("button", { name: /Nueva Sucursal/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole("heading", { name: "Nueva Sucursal" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("heading", { name: "Nueva Sucursal" })).not.toBeInTheDocument();
  });

  it("navigates to branch products pricing when clicking Precios on a branch card", async () => {
    const mockSetBranch = vi.fn();
    renderBranchesPage(Role.ADMIN_GENERAL, mockSetBranch);

    await screen.findByText(/Sucursal Origone/i);

    const pricingButtons = screen.getAllByRole("button", { name: /^Precios$/i });
    expect(pricingButtons.length).toBeGreaterThan(0);

    fireEvent.click(pricingButtons[0]!);
    expect(mockSetBranch).toHaveBeenCalledWith("origone");
  });

  it("opens branch users modal (Encargados), displays managers, and allows adding a new manager", async () => {
    renderBranchesPage(Role.ADMIN_GENERAL);

    await screen.findByText(/Sucursal Origone/i);

    const encargadosButtons = screen.getAllByRole("button", {
      name: /Encargados/i,
    });
    expect(encargadosButtons.length).toBeGreaterThan(0);

    fireEvent.click(encargadosButtons[0]!);

    // Modal opens
    expect(
      await screen.findByRole("heading", { name: /Encargados · Sucursal/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByText("admin.origone@nutrigon.com")
    ).toBeInTheDocument();

    // Open creation form
    const addManagerBtn = screen.getByRole("button", {
      name: /Agregar Encargado/i,
    });
    fireEvent.click(addManagerBtn);

    const nameInput = screen.getByLabelText(/Nombre y Apellido/i);
    fireEvent.change(nameInput, { target: { value: "Carlos Asistente" } });

    const emailInput = screen.getByLabelText(/Correo Electrónico/i);
    fireEvent.change(emailInput, {
      target: { value: "carlos.origone@nutrigon.com" },
    });

    const passInput = screen.getByLabelText(/Contraseña Inicial/i);
    fireEvent.change(passInput, { target: { value: "Segura1234!" } });

    const submitBtn = screen.getByRole("button", { name: "Crear Encargado" });
    fireEvent.click(submitBtn);

    // New user should appear in list
    expect(
      await screen.findByText("carlos.origone@nutrigon.com")
    ).toBeInTheDocument();
  });
});
