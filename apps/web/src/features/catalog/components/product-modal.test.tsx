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
  it("applies a weight offer only to the matching selected portion", () => {
    const product: CatalogProduct = {
      ...mockWeightProduct,
      price: 1000,
      weightOptionsGrams: [100, 250, 500, 1000],
      defaultWeightGrams: 250,
      weightOffers: [{ weightGrams: 250, promotionalPrice: 125 }],
    };
    render(
      <CartProvider>
        <ProductModal
          isOpen
          onClose={() => {}}
          product={product}
          branch={mockBranch}
          categories={mockCategories}
        />
      </CartProvider>
    );

    expect(screen.getByRole("radio", { name: /250g.*125/ })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("button", { name: /Agregar al Pedido.*125/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /500g.*500/ }));
    expect(screen.getByRole("button", { name: /Agregar al Pedido.*500/ })).toBeInTheDocument();
    expect(screen.queryByText(/Ahorrás/)).not.toBeInTheDocument();
  });

  it("shows configured spice weights, per100g reference and exact cent totals", () => {
    const spice = {
      ...mockWeightProduct,
      price: 10500,
      weightOptionsGrams: [25, 50, 75, 100],
      defaultWeightGrams: 25,
      priceReferenceGrams: 100,
    };
    render(
      <CartProvider>
        <ProductModal
          isOpen
          onClose={() => {}}
          product={spice}
          branch={mockBranch}
          categories={mockCategories}
        />
      </CartProvider>
    );
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: /25g/ })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.queryByRole("radio", { name: /250g/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Precio por 100 g:/)).toHaveTextContent(/1\.050/);
    expect(
      screen.getByRole("button", { name: /Agregar al Pedido.*262,50/ })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aumentar cantidad" }));
    expect(
      screen.getByRole("button", { name: /Agregar al Pedido.*525/ })
    ).toBeInTheDocument();
  });
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
    expect(
      screen.getByText("Almendras tostadas de primera calidad.")
    ).toBeInTheDocument();
    expect(screen.getByText(/Precio por 1 kg:/i)).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: "Seleccionar gramaje" })
    ).toBeInTheDocument();
    expect(screen.getByText("Cantidad")).toBeInTheDocument();
    expect(screen.getByText("Cada porción: 250 g")).toBeInTheDocument();

    // Default portion is 250g (0.25 of 10000 = $2.500), appears in main price and 250g card
    expect(screen.getAllByText(/2\.500/).length).toBeGreaterThanOrEqual(1);

    // Select 500g option (0.5 of 10000 = $5.000)
    const portion500g = screen.getByRole("radio", { name: /500g/i });
    fireEvent.click(portion500g);

    expect(screen.getAllByText(/5\.000/).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: /Agregar al Pedido.*5\.000/i })
    ).toBeInTheDocument();

    // Increase pack count to 2
    const incrementBtn = screen.getByRole("button", { name: "Aumentar cantidad" });
    fireEvent.click(incrementBtn);

    // 5000 * 2 = 10000 -> $10.000
    expect(
      screen.getByRole("button", { name: /Agregar al Pedido.*10\.000/i })
    ).toBeInTheDocument();

    // Add to cart
    const addBtn = screen.getByRole("button", { name: /Agregar al Pedido/i });
    fireEvent.click(addBtn);

    expect(screen.getByText(/¡Agregado al pedido!/i)).toBeInTheDocument();
  });

  it("does not claim thermosealed packaging when the product has no description", () => {
    render(
      <CartProvider>
        <ProductModal
          isOpen
          onClose={() => {}}
          product={{ ...mockWeightProduct, description: null }}
          branch={mockBranch}
          categories={mockCategories}
        />
      </CartProvider>
    );

    expect(
      screen.getByText(
        "Frutos secos y alimentos naturales seleccionados para sumar a tu pedido."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/termosellad/i)).not.toBeInTheDocument();
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
