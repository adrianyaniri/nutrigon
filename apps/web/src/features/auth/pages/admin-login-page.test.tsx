import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../context/auth-provider";
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
  it("renders brand headers, branch selector, and login form fields", () => {
    renderLoginPage();

    expect(screen.getByText("Red Operativa Conectada")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Nutrigon · Dietética & Cerealera"
    );
    expect(screen.getByText("Acceso al Panel de Gestión")).toBeInTheDocument();

    // Branch selector buttons
    expect(screen.getByRole("radio", { name: /Centro/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Norte/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Sur/i })).toBeInTheDocument();

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

  it("allows selecting a branch in the segmented control", () => {
    renderLoginPage();

    const centroRadio = screen.getByRole("radio", { name: /Centro/i });
    const norteRadio = screen.getByRole("radio", { name: /Norte/i });

    expect(centroRadio).toHaveAttribute("aria-checked", "true");
    expect(norteRadio).toHaveAttribute("aria-checked", "false");

    fireEvent.click(norteRadio);

    expect(norteRadio).toHaveAttribute("aria-checked", "true");
    expect(centroRadio).toHaveAttribute("aria-checked", "false");
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

  it("authenticates valid credentials and navigates to the admin products page", async () => {
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
      expect(screen.getByTestId("admin-catalog-destination")).toBeInTheDocument();
    });
  });
});
