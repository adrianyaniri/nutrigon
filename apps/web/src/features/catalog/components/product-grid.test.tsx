import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "../types";
import { ProductGrid } from "./product-grid";

const mockProducts: CatalogProduct[] = [
  {
    id: "p1",
    categoryId: "c1",
    name: "Nueces Chandler",
    description: "Nueces mariposa extra light",
    saleUnit: "WEIGHT",
    imageUrl: null,
    price: 3200,
    promotionalPrice: null,
  },
  {
    id: "p2",
    categoryId: "c2",
    name: "Barra Proteica",
    description: null,
    saleUnit: "UNIT",
    imageUrl: null,
    price: 850,
    promotionalPrice: null,
  },
];

describe("ProductGrid", () => {
  it("renders loading skeletons when isLoading is true", () => {
    render(
      <ProductGrid
        products={[]}
        isLoading={true}
        onAdd={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );
    expect(screen.getByRole("status", { name: "Cargando productos" })).toBeInTheDocument();
  });

  it("renders product cards when products are available", () => {
    render(
      <ProductGrid
        products={mockProducts}
        isLoading={false}
        onAdd={vi.fn()}
        onClearFilters={vi.fn()}
      />
    );
    expect(screen.getByText("Nueces Chandler")).toBeInTheDocument();
    expect(screen.getByText("Barra Proteica")).toBeInTheDocument();
  });

  it("renders empty state with clear filters button when products array is empty", () => {
    const onClear = vi.fn();
    render(
      <ProductGrid
        products={[]}
        isLoading={false}
        onAdd={vi.fn()}
        onClearFilters={onClear}
      />
    );
    expect(screen.getByText("No encontramos productos")).toBeInTheDocument();
    const clearBtn = screen.getByRole("button", { name: "Quitar filtros" });
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders suggested categories in empty state and triggers onSelectCategory when clicked", () => {
    const onSelectCategory = vi.fn();
    const suggestions = [
      { slug: "frutos-secos", label: "Frutos Secos" },
      { slug: "harinas", label: "Harinas" },
    ];

    render(
      <ProductGrid
        products={[]}
        isLoading={false}
        onAdd={vi.fn()}
        onClearFilters={vi.fn()}
        suggestedCategories={suggestions}
        onSelectCategory={onSelectCategory}
      />
    );

    const categoryBtn = screen.getByRole("button", { name: "Frutos Secos" });
    expect(categoryBtn).toBeInTheDocument();
    fireEvent.click(categoryBtn);
    expect(onSelectCategory).toHaveBeenCalledWith("frutos-secos");
  });
});
