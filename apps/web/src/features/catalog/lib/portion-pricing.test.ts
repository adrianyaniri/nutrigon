import { describe, expect, it } from "vitest";
import {
  calculatePortionPrice,
  PORTION_OPTIONS,
  getPortionOptions,
  getDefaultPortion,
  toPricePerKg,
} from "./portion-pricing";
import { formatPrice } from "@/lib/format/price";

describe("portion-pricing", () => {
  it("calculates exact spice prices to cents without rounding to tens", () => {
    expect(calculatePortionPrice(10500, "25g")).toBe(262.5);
    expect(calculatePortionPrice(10500, "50g")).toBe(525);
    expect(calculatePortionPrice(10500, "75g")).toBe(787.5);
    expect(calculatePortionPrice(100.2, "25g")).toBe(2.51);
    expect(formatPrice(262.5)).toMatch(/262,50/);
    expect(formatPrice(525)).not.toMatch(/,00/);
  });

  it("uses product portions and initial weight with legacy defaults", () => {
    const settings = { weightOptionsGrams: [25, 50, 75, 100], defaultWeightGrams: 25 };
    expect(getPortionOptions(settings).map((option) => option.value)).toEqual([
      "25g",
      "50g",
      "75g",
      "100g",
    ]);
    expect(getDefaultPortion(settings)).toBe("25g");
    expect(getDefaultPortion({})).toBe("250g");
    expect(getPortionOptions({})).toEqual(PORTION_OPTIONS);
  });

  it("converts per-100-g input to canonical kg prices and rejects malformed portions", () => {
    expect(toPricePerKg(1050, 100)).toBe(10500);
    expect(toPricePerKg(1050, 1000)).toBe(1050);
    expect(() => calculatePortionPrice(1000, "invalid" as never)).toThrow();
  });
  it("calculates proportional prices from base price per 1 kg ($10.000/kg)", () => {
    const basePerKg = 10000;

    expect(calculatePortionPrice(basePerKg, "100g")).toBe(1000);
    expect(calculatePortionPrice(basePerKg, "250g")).toBe(2500);
    expect(calculatePortionPrice(basePerKg, "500g")).toBe(5000);
    expect(calculatePortionPrice(basePerKg, "1kg")).toBe(10000);
  });

  it("defaults to base price per kg if portion is not specified", () => {
    expect(calculatePortionPrice(14500)).toBe(14500);
  });

  it("exports PORTION_OPTIONS with valid multipliers and labels", () => {
    expect(PORTION_OPTIONS).toHaveLength(4);
    expect(PORTION_OPTIONS.map((o) => o.value)).toEqual(["100g", "250g", "500g", "1kg"]);
  });
});
