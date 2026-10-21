import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../context/auth-context";
import { Role, type AuthContextValue } from "../types";
import { ProtectedRoute } from "./protected-route";

function renderForRole(role: Role, unauthorizedRedirectTo?: string) {
  const auth: AuthContextValue = {
    user: {
      id: "user-1",
      email: "branch@example.com",
      fullName: "Branch admin",
      role,
      branchId: "branch-1",
    },
    token: "token",
    selectedBranchSlug: "vergara",
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    setSelectedBranchSlug: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={["/admin/catalogo-maestro"]}>
        <Routes>
          <Route
            path="/admin/catalogo-maestro"
            element={
              <ProtectedRoute
                allowedRoles={[Role.ADMIN_GENERAL]}
                unauthorizedRedirectTo={unauthorizedRedirectTo}
              >
                <div>Master catalog</div>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/productos" element={<div>Branch products</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("ProtectedRoute", () => {
  it("redirects a branch admin to their administrative home when a route is restricted", () => {
    renderForRole(Role.BRANCH_ADMIN, "/admin/productos");

    expect(screen.getByText("Branch products")).toBeInTheDocument();
    expect(screen.queryByText("Master catalog")).not.toBeInTheDocument();
  });

  it("keeps the restricted route available to a general admin", () => {
    renderForRole(Role.ADMIN_GENERAL, "/admin/productos");

    expect(screen.getByText("Master catalog")).toBeInTheDocument();
  });
});
