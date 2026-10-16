import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/public-layout";
import { AdminLayout } from "@/app/layouts/admin-layout";
import { AdminLoginPage, ProtectedRoute, useAuth, Role } from "@/features/auth";
import { AdminProductsPage, CatalogLandingPage, CatalogPage } from "@/features/catalog";
import { AdminBranchesPage } from "@/features/branches";
import { AdminCombosPage } from "@/features/combos";
import { AdminMasterCatalogPage } from "@/features/master-catalog";
import { NotFoundPage } from "./not-found-page";

function AdminIndexRedirect() {
  const { user } = useAuth();
  if (user?.role === Role.ADMIN_GENERAL) {
    return <Navigate to="/admin/catalogo-maestro" replace />;
  }
  return <Navigate to="/admin/productos" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminIndexRedirect /> },
      {
        path: "catalogo-maestro",
        element: <AdminMasterCatalogPage />,
      },
      {
        path: "sucursales",
        element: <AdminBranchesPage />,
      },
      {
        path: "productos",
        element: <AdminProductsPage />,
      },
      {
        path: "combos",
        element: <AdminCombosPage />,
      },
    ],
  },
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <CatalogLandingPage /> },
      {
        path: "catalogo",
        children: [
          { index: true, element: <CatalogLandingPage /> },
          { path: ":branchSlug", element: <CatalogPage /> },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
