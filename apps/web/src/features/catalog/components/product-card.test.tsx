import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "../types";
import { ProductCard } from "./product-card";

const base: CatalogProduct = {
  id: "p1",
  categoryId: "c1",
  name: "Almendras Nonpareil",
  description: null,
  saleUnit: "WEIGHT",
  imageUrl: null,
  price: 1450,
  promotionalPrice: null,
};

describe("ProductCard", () => {
  it("shows name, sale unit and price", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByRole("heading", { name: "Almendras Nonpareil" })).toBeInTheDocument();
    expect(screen.getByText("Granel · Precio por 1 kg")).toBeInTheDocument();
    expect(screen.getByText("/ kg")).toBeInTheDocument();
    expect(screen.getByText(/1\.450/)).toBeInTheDocument();
    expect(screen.queryByText("Oferta")).not.toBeInTheDocument();
  });

  it("shows the promotional price and an 'Oferta' badge when on sale", () => {
    render(<ProductCard product={{ ...base, price: 2000, promotionalPrice: 1500 }} />);
    expect(screen.getByText("Oferta")).toBeInTheDocument();
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
    expect(screen.getByText(/2\.000/)).toBeInTheDocument();
  });

  it("calls onAdd with the product through an accessibly named button", () => {
    const onAdd = vi.fn();
    render(<ProductCard product={base} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar Almendras Nonpareil al pedido" }));
    expect(onAdd).toHaveBeenCalledWith(base);
  });

  it("does not render an add button without onAdd", () => {
    render(<ProductCard product={base} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onSelect when clicking the product card without triggering onAdd", () => {
    const onAdd = vi.fn();
    const onSelect = vi.fn();
    render(<ProductCard product={base} onAdd={onAdd} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("heading", { name: "Almendras Nonpareil" }));
    expect(onSelect).toHaveBeenCalledWith(base);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("shows 'Destacado' badge when product is marked as featured", () => {
    render(<ProductCard product={{ ...base, isFeatured: true }} />);
    expect(screen.getByText("Destacado")).toBeInTheDocument();
  });

  it("triggers onSelect when pressing Enter on a selectable product card", () => {
    const onSelect = vi.fn();
    render(<ProductCard product={base} onSelect={onSelect} />);

    const card = screen.getByRole("button", { name: "Ver detalle de Almendras Nonpareil" });
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(base);
  });
});
