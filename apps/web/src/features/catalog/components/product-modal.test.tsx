import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartProvider } from "@/features/cart";
import { ProductModal } from "./product-modal";
import type { CatalogBranch, CatalogCategory, CatalogProduct } from "../types";

const mockBranch: CatalogBranch = {
  id: "b-centro",
  name: "Centro",
  slug: "centro",
  address: "San Martín 450",
  phone: "351-4210001",
  whatsappNumber: "5493514210001",
};

const mockCategories: CatalogCategory[] = [
  { id: "c-frutos-secos", name: "Frutos Secos", slug: "frutos-secos" },
];

const mockWeightProduct: CatalogProduct = {
  id: "p-almendras",
  categoryId: "c-frutos-secos",
  name: "Almendras Nonpareil",
  description: "Almendras tostadas de primera calidad.",
  saleUnit: "WEIGHT",
  imageUrl: null,
  price: 10000,
  promotionalPrice: null,
};

const mockUnitProduct: CatalogProduct = {
  id: "p-galletas",
  categoryId: "c-frutos-secos",
  name: "Galletas de Arroz",
  description: "Paquete de galletas crocantes.",
  saleUnit: "UNIT",
  imageUrl: null,
  price: 2400,
  promotionalPrice: null,
};

describe("ProductModal", () => {
  it("renders weight product with grammage selector and dynamic price calculation", () => {
    const onClose = vi.fn();
    render(
      <CartProvider>
        <ProductModal
          isOpen={true}
          onClose={onClose}
          product={mockWeightProduct}
          branch={mockBranch}
          categories={mockCategories}
        />
      </CartProvider>
    );

    // Header & details
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Almendras Nonpareil")).toBeInTheDocument();
    expect(screen.getByText("Frutos Secos")).toBeInTheDocument();
    expect(screen.getByText("Almendras tostadas de primera calidad.")).toBeInTheDocument();
    expect(screen.getByText(/Precio por 1 kg:/i)).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Seleccionar gramaje" })).toBeInTheDocument();

    // Default portion is 250g (0.25 of 10000 = $2.500), appears in main price and 250g card
    expect(screen.getAllByText(/2\.500/).length).toBeGreaterThanOrEqual(1);

    // Select 500g option (0.5 of 10000 = $5.000)
    const portion500g = screen.getByRole("radio", { name: /500g/i });
    fireEvent.click(portion500g);

    expect(screen.getAllByText(/5\.000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole("button", { name: /Agregar al Pedido.*5\.000/i })).toBeInTheDocument();

    // Increase pack count to 2
    const incrementBtn = screen.getByRole("button", { name: "Aumentar paquetes" });
    fireEvent.click(incrementBtn);

    // 5000 * 2 = 10000 -> $10.000
    expect(screen.getByRole("button", { name: /Agregar al Pedido.*10\.000/i })).toBeInTheDocument();

    // Add to cart
    const addBtn = screen.getByRole("button", { name: /Agregar al Pedido/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/¡Agregado al pedido!/i)).toBeInTheDocument();
  });

  it("renders unit product without grammage selector", () => {
    const onClose = vi.fn();
    render(
      <CartProvider>
        <ProductModal
          isOpen={true}
          onClose={onClose}
          product={mockUnitProduct}
          branch={mockBranch}
          categories={mockCategories}
        />
      </CartProvider>
    );

    expect(screen.getByText("Galletas de Arroz")).toBeInTheDocument();
    expect(screen.queryByText(/Seleccionar gramaje/i)).not.toBeInTheDocument();
    expect(screen.getByText("Precio por unidad")).toBeInTheDocument();
  });

  it("closes when clicking close button", () => {
    const onClose = vi.fn();
    render(
      <CartProvider>
        <ProductModal
          isOpen={true}
          onClose={onClose}
          product={mockWeightProduct}
          branch={mockBranch}
          categories={mockCategories}
        />
      </CartProvider>
    );

    const closeBtn = screen.getByRole("button", { name: "Cerrar modal de producto" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
