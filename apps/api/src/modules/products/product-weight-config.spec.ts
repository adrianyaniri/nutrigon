import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  updateProductSchema,
  SaleUnit,
} from '@nutrigon/contracts';

const product = {
  categoryId: '11111111-1111-4111-8111-111111111111',
  name: 'Canela',
  saleUnit: SaleUnit.WEIGHT,
  imageUrls: [],
};

describe('product weight configuration contracts', () => {
  it('accepts spice portions and a per-100-g reference', () => {
    expect(
      createProductSchema.parse({
        ...product,
        weightOptionsGrams: [25, 50, 75, 100],
        defaultWeightGrams: 25,
        priceReferenceGrams: 100,
      }),
    ).toMatchObject({ defaultWeightGrams: 25, priceReferenceGrams: 100 });
  });

  it.each([
    { weightOptionsGrams: [] },
    { weightOptionsGrams: [25, 25], defaultWeightGrams: 25 },
    { weightOptionsGrams: [0, 25], defaultWeightGrams: 25 },
    { weightOptionsGrams: [25.5], defaultWeightGrams: 25.5 },
    { weightOptionsGrams: [25, 50], defaultWeightGrams: 75 },
    { priceReferenceGrams: 250 },
  ])('rejects invalid settings %j', (settings) => {
    expect(
      createProductSchema.safeParse({ ...product, ...settings }).success,
    ).toBe(false);
  });

  it('keeps legacy create and partial updates compatible', () => {
    expect(createProductSchema.safeParse(product).success).toBe(true);
    expect(
      createProductSchema.safeParse({ ...product, saleUnit: SaleUnit.UNIT })
        .success,
    ).toBe(true);
    expect(
      updateProductSchema.safeParse({ defaultWeightGrams: 25 }).success,
    ).toBe(true);
    expect(
      updateProductSchema.safeParse({
        weightOptionsGrams: [25, 50],
        defaultWeightGrams: 75,
      }).success,
    ).toBe(false);
  });
});
