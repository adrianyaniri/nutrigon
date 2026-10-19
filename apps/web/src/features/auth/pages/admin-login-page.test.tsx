import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/auth-provider";
import { authRepository } from "../data/auth-repository";
import { Role } from "../types";
import { AdminLoginPage } from "./admin-login-page";

function renderLoginPage(initialEntry = "/admin/login") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/catalogo-maestro"
              element={<div data-testid="admin-master-destination">Panel de Catálogo Maestro</div>}
            />
            <Route
              path="/admin/productos"
              element={<div data-testid="admin-catalog-destination">Panel de Productos</div>}
            />
            <Route path="/catalogo" element={<div>Catálogo Público</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdminLoginPage", () => {
  it("renders brand headers and login form fields without manual branch selector", () => {
    renderLoginPage();

    expect(screen.getByText("Red Operativa Conectada")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Nutrigon · Dietética & Cerealera"
    );
    expect(screen.getByText("Acceso al Panel de Gestión")).toBeInTheDocument();

    // No branch selector radio buttons
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText(/Seleccionar Punto de Venta/i)).not.toBeInTheDocument();

    // Form fields
    expect(screen.getByLabelText("Email o Usuario")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Recordar sesión")).toBeChecked();
    expect(screen.getByRole("button", { name: /Ingresar al Panel/i })).toBeInTheDocument();

    // Auxiliary links
    expect(screen.getByRole("link", { name: /Volver al Catálogo Público/i })).toHaveAttribute(
      "href",
      "/catalogo"
    );
  });

  it("authenticates branch admin and safely redirects to products page even if coming from restricted master catalog", async () => {
    vi.spyOn(authRepository, "login").mockResolvedValueOnce({
      accessToken: "mock-jwt-token-u-branch-admin-origone-123",
      user: {
        id: "u-branch-admin-origone",
        email: "admin.origone@nutrigon.com",
        fullName: "Encargado Sucursal Origone",
        role: Role.BRANCH_ADMIN,
        branchId: "b-origone",
      },
    });

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/admin/login", state: { from: { pathname: "/admin/catalogo-maestro" } } },
          ]}
        >
          <AuthProvider>
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/productos"
                element={<div data-testid="branch-admin-destination">Panel de Sucursal</div>}
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText("Email o Usuario"), {
      target: { value: "admin.origone@nutrigon.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "BranchAdmin2026!" },
    });

    const submitBtn = screen.getByRole("button", { name: /Ingresar al Panel/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("branch-admin-destination")).toBeInTheDocument();
    });
  });

  it("toggles password visibility when clicking the eye button", () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText("Contraseña");
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: "Ver contraseña" });
    fireEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("displays an error message when submitting empty fields", async () => {
    renderLoginPage();

    const submitBtn = screen.getByRole("button", { name: /Ingresar al Panel/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Por favor, ingresá tu email o usuario.")
    ).toBeInTheDocument();
  });

  it("displays error feedback on invalid credentials", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email o Usuario"), {
      target: { value: "desconocido@nutrigon.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "clave-erronea" },
    });

    const submitBtn = screen.getByRole("button", { name: /Ingresar al Panel/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Credenciales inválidas\. Verificá tu email y contraseña\./i)
    ).toBeInTheDocument();
  });

  it("authenticates valid credentials and navigates to the master catalog page for general admin", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("Email o Usuario"), {
      target: { value: "admin@nutrigon.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "AdminNutrigon2026!" },
    });

    const submitBtn = screen.getByRole("button", { name: /Ingresar al Panel/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("admin-master-destination")).toBeInTheDocument();
    });
  });

  it("authenticates general admin and redirects to master catalog even if previous route was branch products page", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter
          initialEntries={[
            { pathname: "/admin/login", state: { from: { pathname: "/admin/productos" } } },
          ]}
        >
          <AuthProvider>
            <Routes>
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/catalogo-maestro"
                element={<div data-testid="general-admin-master-destination">Panel Maestro</div>}
              />
              <Route
                path="/admin/productos"
                element={<div data-testid="branch-products-destination">Panel Sucursal</div>}
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText("Email o Usuario"), {
      target: { value: "admin@nutrigon.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "AdminNutrigon2026!" },
    });

    const submitBtn = screen.getByRole("button", { name: /Ingresar al Panel/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("general-admin-master-destination")).toBeInTheDocument();
      expect(screen.queryByTestId("branch-products-destination")).not.toBeInTheDocument();
    });
  });
});
