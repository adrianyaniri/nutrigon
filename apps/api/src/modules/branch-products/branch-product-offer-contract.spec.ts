import { describe, expect, it } from 'vitest';
import { updateBranchProductOfferSchema } from '@nutrigon/contracts';

describe('branch product offer contract', () => {
  it('accepts either one whole-product offer or unique weight offers, never both', () => {
    expect(
      updateBranchProductOfferSchema.safeParse({
        isOnSale: true,
        promotionalPrice: null,
        weightOffers: [{ weightGrams: 250, promotionalPrice: 125 }],
      }).success,
    ).toBe(true);

    expect(
      updateBranchProductOfferSchema.safeParse({
        isOnSale: true,
        promotionalPrice: 500,
        weightOffers: [{ weightGrams: 250, promotionalPrice: 125 }],
      }).success,
    ).toBe(false);

    expect(
      updateBranchProductOfferSchema.safeParse({
        isOnSale: true,
        promotionalPrice: null,
        weightOffers: [
          { weightGrams: 250, promotionalPrice: 125 },
          { weightGrams: 250, promotionalPrice: 100 },
        ],
      }).success,
    ).toBe(false);
  });
});
