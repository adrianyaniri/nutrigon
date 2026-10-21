import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  it("shows the configured reference and the actual smallest purchasable spice portion", () => {
    render(
      <ProductCard
        product={{
          ...base,
          price: 10500,
          priceReferenceGrams: 100,
          weightOptionsGrams: [25, 50, 75, 100],
          defaultWeightGrams: 25,
        }}
      />
    );
    expect(screen.getByText("Granel · Precio por 100 g")).toBeInTheDocument();
    expect(screen.getByText("/ 100 g")).toBeInTheDocument();
    expect(screen.getByText(/Desde.*262,50.*25g/)).toBeInTheDocument();
    expect(screen.getByText(/1\.050/)).toBeInTheDocument();
  });
  afterEach(() => {
    cleanup();
  });

  it("shows name, sale unit, starting 100g portion price, and kg price for WEIGHT products", () => {
    render(<ProductCard product={base} />);
    expect(
      screen.getByRole("heading", { name: "Almendras Nonpareil" })
    ).toBeInTheDocument();
    expect(screen.getByText("Granel · Precio por 1 kg")).toBeInTheDocument();
    expect(screen.getByText("/ kg")).toBeInTheDocument();
    expect(screen.getByText(/1\.450/)).toBeInTheDocument();
    expect(screen.getByText(/Desde.*145.*\/ 100g/)).toBeInTheDocument();
    expect(screen.queryByText("Oferta")).not.toBeInTheDocument();
  });

  it("shows the promotional price and an 'Oferta' badge when on sale", () => {
    render(<ProductCard product={{ ...base, price: 2000, promotionalPrice: 1500 }} />);
    expect(screen.getByText("Oferta")).toBeInTheDocument();
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
    expect(screen.getByText(/2\.000/)).toBeInTheDocument();
  });

  it("renders an 'Elegir' button for WEIGHT products without false 'added' checkmark", () => {
    const onAdd = vi.fn();
    render(<ProductCard product={base} onAdd={onAdd} />);
    const chooseBtn = screen.getByRole("button", {
      name: "Elegir gramos de Almendras Nonpareil",
    });
    fireEvent.click(chooseBtn);
    expect(onAdd).toHaveBeenCalledWith(base);
    expect(
      screen.queryByRole("button", { name: "Almendras Nonpareil agregado al pedido" })
    ).not.toBeInTheDocument();
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

    const card = screen.getByRole("button", {
      name: "Ver detalle de Almendras Nonpareil",
    });
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(base);
  });

  it("displays transient check feedback when adding a UNIT product to cart", () => {
    const onAdd = vi.fn();
    const unitProduct: CatalogProduct = {
      ...base,
      id: "p2",
      name: "Galletas de Arroz",
      saleUnit: "UNIT",
      price: 1200,
    };
    render(<ProductCard product={unitProduct} onAdd={onAdd} />);
    const addBtn = screen.getByRole("button", {
      name: "Agregar Galletas de Arroz al pedido",
    });
    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalledWith(unitProduct);
    expect(
      screen.getByRole("button", { name: "Galletas de Arroz agregado al pedido" })
    ).toBeInTheDocument();
  });
});
