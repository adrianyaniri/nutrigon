import { afterEach, describe, it, expect } from "vitest";
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
      priceReferenceGrams={reference as 100 | 1000}
      isSaving={false}
      onDraftPriceChange={noop}
      onPriceReferenceChange={noop}
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

describe("BranchProductRow price unit controls", () => {
  it("keeps UNIT products without a weight price selector", () => {
    render(
      <BranchProductRow
        item={{
          productId: "unit-product",
          name: "Unit product",
          description: null,
          categoryId: "c",
          categoryName: "Pantry",
          saleUnit: "UNIT",
          barcode: null,
          imageUrls: [],
          status: "ACTIVE",
          price: 500,
          promotionalPrice: null,
          isOnSale: false,
          isAvailable: true,
          isFeatured: false,
        }}
        draftValue="500"
        priceReferenceGrams={1000}
        isSaving={false}
        onDraftPriceChange={noop}
        onPriceReferenceChange={noop}
        onSavePrice={noop}
        onToggleAvailability={noop}
        onToggleFeatured={noop}
        onOpenOfferModal={noop}
      />
    );

    expect(screen.queryByLabelText("Unidad de precio de Unit product")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Precio de Unit product")).toBeInTheDocument();
  });
});
