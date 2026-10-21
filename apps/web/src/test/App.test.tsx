import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/App";
import { catalogRepository } from "@/features/catalog/data/catalog-repository";
import type { CatalogBranch } from "@/features/catalog/types";

const publicBranches: CatalogBranch[] = [
  {
    id: "branch-vergara",
    name: "Nutrigon Vergara",
    slug: "vergara",
    address: "Vergara 100",
    phone: null,
    whatsappNumber: null,
  },
  {
    id: "branch-villegas",
    name: "Nutrigon Villegas",
    slug: "villegas",
    address: "Villegas 200",
    phone: null,
    whatsappNumber: null,
  },
  {
    id: "branch-origone",
    name: "Nutrigon Origone",
    slug: "origone",
    address: "Origone 300",
    phone: null,
    whatsappNumber: null,
  },
];

describe("Application Bootstrap", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(catalogRepository, "getBranches").mockResolvedValue(publicBranches);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders main branding, catalog landing, and admin access button without errors", async () => {
    render(<App />);

    expect(screen.getAllByText("Nutrigon").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dietética & Cerealera/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Elegí tu sucursal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Acceso Gestión/i })).toHaveAttribute(
      "href",
      "/admin"
    );

    await screen.findByRole("heading", { name: "Nutrigon Vergara" });
  });

  it("renders the business branches and QR actions", async () => {
    render(<App />);

    for (const branch of publicBranches) {
      expect(await screen.findByRole("heading", { name: branch.name })).toBeInTheDocument();
    }

    const catalogLinks = screen.getAllByRole("link", { name: /Ver catálogo/i });
    expect(catalogLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/catalogo/vergara",
      "/catalogo/villegas",
      "/catalogo/origone",
    ]);

    const vergaraCard = screen
      .getByRole("heading", { name: "Nutrigon Vergara" })
      .closest("article") as HTMLElement;
    expect(within(vergaraCard).getByRole("button", { name: /Código QR/i })).toBeInTheDocument();
    expect(within(vergaraCard).getByRole("button", { name: /Compartir/i })).toBeInTheDocument();
  });
});
