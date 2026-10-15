import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/public-layout";
import { RootLayout } from "@/app/layouts/root-layout";
import { CatalogPage } from "@/features/catalog";
import { HomePage } from "./home-page";
import { NotFoundPage } from "./not-found-page";

export const router = createBrowserRouter([
  {
    path: "/catalogo",
    element: <PublicLayout />,
    children: [{ index: true, element: <CatalogPage /> }],
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
