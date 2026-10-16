import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/public-layout";
import { RootLayout } from "@/app/layouts/root-layout";
import { AdminLayout } from "@/app/layouts/admin-layout";
import { AdminLoginPage, ProtectedRoute } from "@/features/auth";
import { AdminProductsPage, CatalogLandingPage, CatalogPage } from "@/features/catalog";
import { HomePage } from "./home-page";
import { NotFoundPage } from "./not-found-page";

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
      { index: true, element: <Navigate to="/admin/productos" replace /> },
      {
        path: "productos",
        element: <AdminProductsPage />,
      },
    ],
  },
  {
    path: "/catalogo",
    element: <PublicLayout />,
    children: [
      { index: true, element: <CatalogLandingPage /> },
      { path: ":branchSlug", element: <CatalogPage /> },
    ],
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

