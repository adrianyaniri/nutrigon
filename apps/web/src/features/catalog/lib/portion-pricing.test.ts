import { describe, expect, it } from "vitest";
import {
  calculatePortionPrice,
  PORTION_OPTIONS,
} from "./portion-pricing";

describe("portion-pricing", () => {
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

