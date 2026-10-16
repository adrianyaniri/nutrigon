import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/public-layout";
import { RootLayout } from "@/app/layouts/root-layout";
import { AdminLoginPage, ProtectedRoute } from "@/features/auth";
import { CatalogLandingPage, CatalogPage } from "@/features/catalog";
import { HomePage } from "./home-page";
import { NotFoundPage } from "./not-found-page";

export const router = createBrowserRouter([
  {
    path: "/admin/login",
    element: <AdminLoginPage />,
  },
  {
    path: "/admin",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/admin/productos" replace /> },
      {
        path: "productos",
        element: (
          <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6 text-foreground text-center">
            <h1 className="font-headline text-2xl font-bold text-brand-gold">
              Panel de Gestión de Catálogo
            </h1>
            <p className="mt-2 text-sm text-brand-muted max-w-md">
              Sesión iniciada con éxito. Listo para la implementación de la vista con tabla y drawer.
            </p>
          </div>
        ),
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

