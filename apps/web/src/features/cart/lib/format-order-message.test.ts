import { describe, expect, it } from "vitest";
import { formatWhatsAppOrderMessage } from "./format-order-message";
import { formatPrice } from "@/lib/format/price";

describe("formatWhatsAppOrderMessage", () => {
  it("includes exact cents, package weight and total weight for spices when quantity > 1", () => {
    const message = formatWhatsAppOrderMessage({
      branchName: "Centro",
      items: [
        {
          name: "Canela",
          quantity: 3,
          saleUnit: "WEIGHT",
          portion: "25g",
          unitPrice: 262.5,
          lineTotal: 787.5,
        },
      ],
      total: 787.5,
      fulfillment: "pickup",
      customerName: "Ana",
    });
    expect(message).toContain("3x Canela (Granel · 25g)");
    expect(message).toContain("75 g en total");
    expect(message).toContain(`${formatPrice(262.5)} por paquete`);
    expect(message).toContain(formatPrice(787.5));
  });

  it("formats single quantity bulk item cleanly without repeating weights", () => {
    const message = formatWhatsAppOrderMessage({
      branchName: "Pedro Díaz",
      items: [
        {
          name: "Yuyos",
          quantity: 1,
          saleUnit: "WEIGHT",
          portion: "25g",
          unitPrice: 500,
          lineTotal: 500,
        },
      ],
      total: 500,
      fulfillment: "pickup",
      customerName: "Ana",
    });
    expect(message).toContain(`• 1x Yuyos (Granel · 25g) — ${formatPrice(500)}`);
    expect(message).not.toContain("por paquete");
  });

  it("rejects missing weight instead of inventing a 100g portion", () => {
    expect(() =>
      formatWhatsAppOrderMessage({
        branchName: "Centro",
        items: [
          {
            name: "Canela",
            quantity: 1,
            saleUnit: "WEIGHT",
            unitPrice: 262.5,
            lineTotal: 262.5,
          },
        ],
        total: 262.5,
        fulfillment: "pickup",
        customerName: "Ana",
      })
    ).toThrow("Weight portion is required");
  });

  it("formats order message with items, pickup fulfillment and customer details", () => {
    const message = formatWhatsAppOrderMessage({
      branchName: "Centro",
      items: [
        {
          name: "Almendras Nonpareil",
          quantity: 2,
          saleUnit: "WEIGHT",
          portion: "100g",
          unitPrice: 1450,
          lineTotal: 2900,
        },
        {
          name: "Galletas de Arroz",
          quantity: 1,
          saleUnit: "UNIT",
          unitPrice: 2400,
          lineTotal: 2400,
        },
      ],
      total: 5300,
      fulfillment: "pickup",
      customerName: "Sofía Gómez",
      notes: "Paso a retirar a las 18:30 hs",
    });

    expect(message).toContain("¡Hola Nutrigon (Sucursal Centro)! 👋");
    expect(message).toContain("• 2x Almendras Nonpareil (Granel · 100g)");
    expect(message).toContain(`• 1x Galletas de Arroz — ${formatPrice(2400)}`);
    expect(message).not.toContain("(Unidad)");
    expect(message).toContain(`Total a pagar: ${formatPrice(5300)}`);
    expect(message).toContain("Modalidad: Retiro en sucursal (sin costo de envío)");
    expect(message).toContain("Cliente: Sofía Gómez");
    expect(message).toContain("Notas: Paso a retirar a las 18:30 hs");
  });

  it("handles delivery mode and clarifies products subtotal and shipping notice", () => {
    const message = formatWhatsAppOrderMessage({
      branchName: "Norte",
      items: [
        {
          name: "Nueces Mariposa",
          quantity: 1,
          saleUnit: "WEIGHT",
          portion: "100g",
          unitPrice: 1600,
          lineTotal: 1600,
        },
      ],
      total: 1600,
      fulfillment: "delivery",
      customerName: "",
    });

    expect(message).toContain("¡Hola Nutrigon (Sucursal Norte)! 👋");
    expect(message).toContain(`Subtotal productos: ${formatPrice(1600)}`);
    expect(message).toContain("Modalidad: Envío a domicilio (a coordinar)");
    expect(message).toContain("Cliente: A coordinar");
    expect(message).toContain("Costo de envío:* A coordinar con la sucursal");
    expect(message).not.toContain("Notas:");
  });

  it("correctly describes portion size for WEIGHT items without contradiction", () => {
    const message = formatWhatsAppOrderMessage({
      branchName: "Centro",
      items: [
        {
          name: "Almendras Nonpareil",
          quantity: 2,
          saleUnit: "WEIGHT",
          portion: "250g",
          unitPrice: 3625,
          lineTotal: 7250,
        },
        {
          name: "Mix Frutos Rojos",
          quantity: 1,
          saleUnit: "WEIGHT",
          portion: "500g",
          unitPrice: 5900,
          lineTotal: 5900,
        },
      ],
      total: 13150,
      fulfillment: "pickup",
      customerName: "Carlos Pérez",
    });

    expect(message).toContain("• 2x Almendras Nonpareil (Granel · 250g");
    expect(message).toContain("• 1x Mix Frutos Rojos (Granel · 500g)");
    expect(message).not.toContain("100 g");
  });
});
