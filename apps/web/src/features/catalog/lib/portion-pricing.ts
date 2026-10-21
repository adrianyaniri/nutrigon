/** Keep legacy cart keys while allowing product-specific integer gram portions. */
export type WeightPortion = `${number}g` | "1kg";

export interface WeightConfiguration {
  weightOptionsGrams?: number[];
  defaultWeightGrams?: number;
  priceReferenceGrams?: number;
}

export interface PortionOption {
  value: WeightPortion;
  label: string;
  multiplier: number;
  discountRate: number;
  badge?: string;
}

export function formatWeight(grams: number): string {
  return grams === 1000 ? "1 kg" : `${grams} g`;
}

export function portionFromGrams(grams: number): WeightPortion {
  return grams === 1000 ? "1kg" : `${grams}g`;
}

export function portionGrams(portion: string): number {
  const grams =
    portion === "1kg"
      ? 1000
      : /^\d+g$/.test(portion)
        ? Number(portion.slice(0, -1))
        : NaN;
  if (!Number.isSafeInteger(grams) || grams <= 0 || grams > 1000000)
    throw new RangeError("Invalid weight portion");
  return grams;
}

function makeOption(grams: number): PortionOption {
  return {
    value: portionFromGrams(grams),
    label: formatWeight(grams),
    multiplier: grams / 1000,
    discountRate: 0,
  };
}

export const PORTION_OPTIONS: readonly PortionOption[] = [100, 250, 500, 1000].map(
  makeOption
);

export function getPortionOptions(config: WeightConfiguration): readonly PortionOption[] {
  return config.weightOptionsGrams?.map(makeOption) ?? PORTION_OPTIONS;
}

export function getDefaultPortion(config: WeightConfiguration): WeightPortion {
  return portionFromGrams(config.defaultWeightGrams ?? 250);
}

export function getPriceReferenceGrams(config: WeightConfiguration): number {
  return config.priceReferenceGrams === 100 ? 100 : 1000;
}

/** Prices are canonical kg amounts with at most two decimals. Round half up only at the cent boundary. */
export function proportionalPrice(
  price: number,
  numerator: number,
  denominator: number
): number {
  const cents = Math.round(price * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError("Invalid price");
  const divisor = BigInt(denominator);
  return Number((BigInt(cents) * BigInt(numerator) + divisor / 2n) / divisor) / 100;
}

export function calculatePortionPrice(
  basePricePerKg: number,
  portion?: WeightPortion
): number {
  return portion
    ? proportionalPrice(basePricePerKg, portionGrams(portion), 1000)
    : basePricePerKg;
}

export function referencePrice(pricePerKg: number, config: WeightConfiguration): number {
  return proportionalPrice(pricePerKg, getPriceReferenceGrams(config), 1000);
}

export function toPricePerKg(inputPrice: number, referenceGrams: number): number {
  return proportionalPrice(inputPrice, 1000, referenceGrams);
}

export function multiplyPrice(price: number, quantity: number): number {
  return (Math.round(price * 100) * quantity) / 100;
}

export function sumPrices(prices: number[]): number {
  return prices.reduce((total, value) => total + Math.round(value * 100), 0) / 100;
}
