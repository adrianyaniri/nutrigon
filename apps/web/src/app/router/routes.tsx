import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/public-layout";
import { AdminIndexRedirect, ProtectedRoute, Role } from "@/features/auth";
import { CatalogLandingPage, CatalogPage } from "@/features/catalog";
import { AdminLoadingFallback } from "./admin-loading-fallback";
import { NotFoundPage } from "./not-found-page";

const AdminLoginPage = lazy(() =>
  import("@/features/auth/pages/admin-login-page").then((m) => ({ default: m.AdminLoginPage }))
);
const AdminLayout = lazy(() =>
  import("@/app/layouts/admin-layout").then((m) => ({ default: m.AdminLayout }))
);
const AdminMasterCatalogPage = lazy(() =>
  import("@/features/master-catalog/pages/admin-master-catalog-page").then((m) => ({
    default: m.AdminMasterCatalogPage,
  }))
);
const AdminBranchesPage = lazy(() =>
  import("@/features/branches/pages/admin-branches-page").then((m) => ({
    default: m.AdminBranchesPage,
  }))
);
const AdminProductsPage = lazy(() =>
  import("@/features/catalog/pages/admin-products-page").then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminCombosPage = lazy(() =>
  import("@/features/combos/pages/admin-combos-page").then((m) => ({
    default: m.AdminCombosPage,
  }))
);

export const router = createBrowserRouter([
  {
    path: "/admin/login",
    element: (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminLoginPage />
      </Suspense>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<AdminLoadingFallback />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <AdminIndexRedirect /> },
      {
        path: "catalogo-maestro",
        element: (
          <ProtectedRoute
            allowedRoles={[Role.ADMIN_GENERAL]}
            unauthorizedRedirectTo="/admin/productos"
          >
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminMasterCatalogPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "sucursales",
        element: (
          <ProtectedRoute
            allowedRoles={[Role.ADMIN_GENERAL]}
            unauthorizedRedirectTo="/admin/productos"
          >
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminBranchesPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "productos",
        element: (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminProductsPage />
          </Suspense>
        ),
      },
      {
        path: "combos",
        element: (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminCombosPage />
          </Suspense>
        ),
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
