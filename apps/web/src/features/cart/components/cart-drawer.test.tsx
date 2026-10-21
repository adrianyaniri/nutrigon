import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  it.each([undefined, "250g", "invalid"])(
    "blocks checkout for missing or obsolete weight %s",
    (portion) => {
      const open = vi.spyOn(window, "open").mockImplementation(() => null);
      const spice = {
        ...mockProducts[0],
        weightOptionsGrams: [25, 50, 75, 100],
        defaultWeightGrams: 25,
        priceReferenceGrams: 100,
        price: 10500,
      };
      function Trigger() {
        const { addProduct } = useCart();
        return (
          <>
            <button onClick={() => addProduct("centro", spice.id, 1, portion as never)}>
              Add spice
            </button>
            <CartDrawer
              isOpen
              onClose={() => {}}
              branch={mockBranch}
              products={[spice]}
            />
          </>
        );
      }
      render(
        <CartProvider>
          <Trigger />
        </CartProvider>
      );
      fireEvent.click(screen.getByText("Add spice"));
      expect(screen.getByRole("alert")).toHaveTextContent(/Revisá las cantidades/);
      const submit = screen.getByRole("button", { name: /Enviar Pedido por WhatsApp/ });
      expect(submit).toBeDisabled();
      fireEvent.click(submit);
      expect(open).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: /Eliminar Almendras/ }));
      expect(screen.getByText("Tu pedido está vacío")).toBeInTheDocument();
      open.mockRestore();
    }
  );

  it("keeps configured spice portions separate and sends exact cart totals", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const spice = {
      ...mockProducts[0],
      weightOptionsGrams: [25, 50],
      defaultWeightGrams: 25,
      price: 10500,
    };
    function Trigger() {
      const { addProduct } = useCart();
      return (
        <>
          <button
            onClick={() => {
              addProduct("centro", spice.id, 3, "25g");
              addProduct("centro", spice.id, 1, "50g");
            }}
          >
            Add spice
          </button>
          <CartDrawer isOpen onClose={() => {}} branch={mockBranch} products={[spice]} />
        </>
      );
    }
    render(
      <CartProvider>
        <Trigger />
      </CartProvider>
    );
    fireEvent.click(screen.getByText("Add spice"));
    expect(screen.getByText(/75 g en total/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Enviar Pedido por WhatsApp/ }));
    const message = decodeURIComponent(String(open.mock.calls[0][0]));
    expect(message).toContain("787,50");
    expect(message).toContain("1.312,50");
    expect(message).toContain("25g");
    expect(message).toContain("50g");
    open.mockRestore();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders empty state when there are no items in cart", () => {
    render(
      <CartProvider>
        <CartDrawer
          isOpen={true}
          onClose={vi.fn()}
          branch={mockBranch}
          products={mockProducts}
        />
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
            onClick={() => addProduct("centro", "p-almendras", 1, "1kg")}
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

    // Delivery fulfillment radiogroup is accessible
    expect(
      screen.getByRole("radiogroup", { name: "Modalidad de entrega" })
    ).toBeInTheDocument();
    const pickupRadio = screen.getByRole("radio", { name: /Retiro en mostrador/i });
    const deliveryRadio = screen.getByRole("radio", { name: /Envío a domicilio/i });
    expect(pickupRadio).toHaveAttribute("aria-checked", "true");
    expect(deliveryRadio).toHaveAttribute("aria-checked", "false");

    fireEvent.click(deliveryRadio);
    expect(pickupRadio).toHaveAttribute("aria-checked", "false");
    expect(deliveryRadio).toHaveAttribute("aria-checked", "true");

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

  it("requires confirmation before clearing the cart", () => {
    function TestCartTrigger() {
      const { addProduct } = useCart();
      return (
        <div>
          <button type="button" onClick={() => addProduct("centro", "p-almendras")}>
            Add Almendras
          </button>
          <CartDrawer
            isOpen={true}
            onClose={vi.fn()}
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

    fireEvent.click(screen.getByText("Add Almendras"));
    expect(screen.getByText("Almendras Nonpareil")).toBeInTheDocument();

    // First click on Vaciar carrito shows confirmation controls instead of clearing immediately
    fireEvent.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    expect(screen.getByText("Almendras Nonpareil")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirmar vaciar carrito" })
    ).toBeInTheDocument();

    // Cancel keeps the cart intact
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Almendras Nonpareil")).toBeInTheDocument();

    // Click Vaciar again and confirm
    fireEvent.click(screen.getByRole("button", { name: "Vaciar carrito" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar vaciar carrito" }));
    expect(screen.getByText("Tu pedido está vacío")).toBeInTheDocument();
  });
});
