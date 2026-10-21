import { afterEach, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BranchProductRow } from "./branch-product-row";

afterEach(cleanup);
const noop = () => {};

it.each([
  { reference: 1000, amount: "1.234,56" },
  { reference: 100, amount: "123,46" },
])("uses reference $reference in the offer tooltip", ({ reference, amount }) => {
  render(
    <BranchProductRow
      item={{
        productId: "p",
        name: "Spice",
        description: null,
        categoryId: "c",
        categoryName: "Spices",
        saleUnit: "WEIGHT",
        barcode: null,
        imageUrls: [],
        status: "ACTIVE",
        price: 9876.54,
        promotionalPrice: 1234.56,
        priceReferenceGrams: reference,
        isOnSale: true,
        isAvailable: true,
        isFeatured: false,
      }}
      draftValue={reference === 100 ? "987.65" : "9876.54"}
      isSaving={false}
      onDraftPriceChange={noop}
      onSavePrice={noop}
      onToggleAvailability={noop}
      onToggleFeatured={noop}
      onOpenOfferModal={noop}
    />
  );
  expect(screen.getByRole("button", { name: "Editar oferta de Spice" })).toHaveAttribute(
    "title",
    `Oferta activa: $\u00a0${amount} (clic para editar)`
  );
});
