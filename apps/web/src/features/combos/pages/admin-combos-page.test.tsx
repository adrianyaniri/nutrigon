import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext } from "@/features/auth/context/auth-context";
import { Role } from "@/features/auth/types";
import { AdminCombosPage } from "./admin-combos-page";

function renderAdminCombosPage() {
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
        <MemoryRouter initialEntries={["/admin/combos"]}>
          <AdminCombosPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

describe("AdminCombosPage (Branch Combos Management)", () => {
  it("renders branch combos list and metrics strip", async () => {
    renderAdminCombosPage();

    expect(
      await screen.findByRole("heading", {
        name: /Gestión de Combos y Packs/i,
      })
    ).toBeInTheDocument();

    expect(await screen.findByText("Pack Desayuno Saludable")).toBeInTheDocument();
    expect(screen.getByText("Total de Combos")).toBeInTheDocument();
    expect(screen.getByText("Disponibles al Público")).toBeInTheDocument();
  });

  it("toggles combo availability between Disponible and Pausado", async () => {
    renderAdminCombosPage();

    await screen.findByText("Pack Desayuno Saludable");
    const pauseButton = screen.getByRole("button", { name: "Pausar" });
    fireEvent.click(pauseButton);

    expect(
      await screen.findByText(/El combo "Pack Desayuno Saludable" ahora está pausado/i)
    ).toBeInTheDocument();

    const activateButton = await screen.findByRole("button", { name: "Activar" });
    expect(activateButton).toBeInTheDocument();
  });

  it("opens the create modal, adds products, sets combo price, and creates a new combo", async () => {
    renderAdminCombosPage();

    await screen.findByText("Pack Desayuno Saludable");

    const newComboButton = screen.getByRole("button", { name: /Nuevo Combo/i });
    fireEvent.click(newComboButton);

    expect(await screen.findByRole("heading", { name: /Armar Nuevo Combo/i })).toBeInTheDocument();

    // Fill combo name
    const nameInput = screen.getByLabelText(/Nombre del Combo/i);
    fireEvent.change(nameInput, { target: { value: "Mix Frutos Secos Premium" } });

    // Add first product from the search/picker
    const addButtons = await screen.findAllByRole("button", { name: "+ Agregar" });
    expect(addButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(addButtons[0]!);

    // Add second product
    const updatedAddButtons = await screen.findAllByRole("button", { name: "+ Agregar" });
    fireEvent.click(updatedAddButtons[0]!);

    // Verify at least 2 items added
    expect(await screen.findByText(/Productos Incluidos \(2\/2 mínimos\)/i)).toBeInTheDocument();

    // Fill price
    const priceInput = screen.getByLabelText(/Precio Final del Combo/i);
    fireEvent.change(priceInput, { target: { value: "12000" } });

    // Submit form
    const saveButton = screen.getByRole("button", { name: "Guardar Combo" });
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    // Verify success banner and new combo rendered in the list
    expect(
      await screen.findByText(/¡Combo "Mix Frutos Secos Premium" creado y publicado exitosamente!/i)
    ).toBeInTheDocument();

    expect(screen.getByText("Mix Frutos Secos Premium")).toBeInTheDocument();
  });

  it("opens delete confirmation modal and removes a combo", async () => {
    renderAdminCombosPage();

    await screen.findByText("Pack Desayuno Saludable");

    const deleteBtn = screen.getByRole("button", {
      name: /Eliminar combo Pack Desayuno Saludable/i,
    });
    fireEvent.click(deleteBtn);

    expect(
      await screen.findByRole("heading", {
        name: /¿Eliminar el combo "Pack Desayuno Saludable"\?/i,
      })
    ).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: "Confirmar eliminación" });
    fireEvent.click(confirmButton);

    expect(
      await screen.findByText(/El combo "Pack Desayuno Saludable" fue eliminado correctamente/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Pack Desayuno Saludable")).not.toBeInTheDocument();
    });
  });
});
