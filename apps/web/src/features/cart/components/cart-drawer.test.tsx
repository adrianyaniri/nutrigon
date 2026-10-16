import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/features/cart";
import { CartDrawer } from "./cart-drawer";
import type { CatalogBranch, CatalogProduct } from "@/features/catalog/types";

const mockBranch: CatalogBranch = {
  id: "b-centro",
  name: "Centro",
  slug: "centro",
  address: "San Martín 450",
  phone: "351-4210001",
  whatsappNumber: "5493514210001",
};

const mockProducts: CatalogProduct[] = [
  {
    id: "p-almendras",
    categoryId: "c-frutos-secos",
    name: "Almendras Nonpareil",
    description: null,
    saleUnit: "WEIGHT",
    imageUrl: null,
    price: 1450,
    promotionalPrice: null,
  },
  {
    id: "p-nueces",
    categoryId: "c-frutos-secos",
    name: "Nueces Mariposa",
    description: null,
    saleUnit: "WEIGHT",
    imageUrl: null,
    price: 1900,
    promotionalPrice: 1600,
  },
];

describe("CartDrawer", () => {
  it("renders empty state when there are no items in cart", () => {
    render(
      <CartProvider>
        <CartDrawer isOpen={true} onClose={vi.fn()} branch={mockBranch} products={mockProducts} />
      </CartProvider>
    );

    expect(screen.getByRole("dialog", { name: /tu pedido/i })).toBeInTheDocument();
    expect(screen.getByText("Tu pedido está vacío")).toBeInTheDocument();
  });

  it("renders products, allows quantity changes, and opens WhatsApp on submit", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const onClose = vi.fn();

    function TestCartTrigger() {
      const { addProduct } = useCart();
      return (
        <div>
          <button
            type="button"
            onClick={() => addProduct("centro", "p-almendras")}
          >
            Add Almendras
          </button>
          <CartDrawer
            isOpen={true}
            onClose={onClose}
            branch={mockBranch}
            products={mockProducts}
          />
        </div>
      );
    }

    render(
      <CartProvider>
        <TestCartTrigger />
      </CartProvider>
    );

    // Initially empty
    expect(screen.getByText("Tu pedido está vacío")).toBeInTheDocument();

    // Add item
    fireEvent.click(screen.getByText("Add Almendras"));

    // Item rendered
    expect(screen.getByText("Almendras Nonpareil")).toBeInTheDocument();
    expect(screen.getAllByText(/Sucursal Centro/).length).toBeGreaterThan(0);
    expect(screen.getByText("Total Estimado")).toBeInTheDocument();

    // Increase quantity with stepper
    const incrementBtn = screen.getByRole("button", {
      name: "Aumentar cantidad de Almendras Nonpareil",
    });
    fireEvent.click(incrementBtn);

    // Quantity should be 2
    expect(screen.getByText("2")).toBeInTheDocument();

    // Type customer name
    const nameInput = screen.getByPlaceholderText("Ingresá tu nombre y apellido");
    fireEvent.change(nameInput, { target: { value: "Carlos Pérez" } });

    // Submit WhatsApp
    const submitBtn = screen.getByRole("button", { name: /Enviar Pedido por WhatsApp/i });
    fireEvent.click(submitBtn);

    expect(openSpy).toHaveBeenCalled();
    const calledUrl = openSpy.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("https://wa.me/5493514210001?text=");
    expect(decodeURIComponent(calledUrl)).toContain("Carlos Pérez");
    expect(decodeURIComponent(calledUrl)).toContain("2x Almendras Nonpareil");

    openSpy.mockRestore();
  });
});
