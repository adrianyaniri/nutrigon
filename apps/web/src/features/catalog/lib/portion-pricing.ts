export type WeightPortion = "100g" | "250g" | "500g" | "1kg";

export interface PortionOption {
  value: WeightPortion;
  label: string;
  multiplier: number;
  discountRate: number; // 0 to 1
  badge?: string;
}

export const PORTION_OPTIONS: readonly PortionOption[] = [
  {
    value: "100g",
    label: "100g",
    multiplier: 0.1,
    discountRate: 0,
  },
  {
    value: "250g",
    label: "250g",
    multiplier: 0.25,
    discountRate: 0,
    badge: "Popular",
  },
  {
    value: "500g",
    label: "500g",
    multiplier: 0.5,
    discountRate: 0,
  },
  {
    value: "1kg",
    label: "1 kg",
    multiplier: 1,
    discountRate: 0,
  },
];

function roundToTen(value: number): number {
  return Math.round(value / 10) * 10;
}

/**
 * Calculates effective price for a bulk portion based on the base price per 1 kg.
 */
export function calculatePortionPrice(basePricePerKg: number, portion?: WeightPortion): number {
  if (!portion) return basePricePerKg;

  const option = PORTION_OPTIONS.find((opt) => opt.value === portion);
  if (!option) return basePricePerKg;

  const raw = basePricePerKg * option.multiplier * (1 - option.discountRate);
  return roundToTen(raw);
}

