import { describe, expect, it } from 'vitest';
import {
  runBranchPriceImport,
  type BranchPriceImportRow,
  type BranchPriceImportStore,
} from './branch-prices.import.js';

const header =
  'branch_slug,code,name,original_price_ars,reference_grams,price_per_kg_ars,source_line';
const parsley = 'vergara,761,Perejil,900,50,18000,94';
const oregano = 'vergara,400,Oregano,600,50,12000,93';

class InMemoryBranchPriceImportStore implements BranchPriceImportStore {
  readonly branches = new Map([
    ['vergara', { id: 'branch-vergara', slug: 'vergara' }],
  ]);
  readonly products = new Map([
    ['761', { id: 'product-parsley', code: '761' }],
    ['400', { id: 'product-oregano', code: '400' }],
  ]);
  readonly branchProducts = new Map<string, BranchPriceImportRow>();
  transactionCalls = 0;

  async findBranchBySlug(slug: string) {
    return this.branches.get(slug) ?? null;
  }

  async findProductsByCodes(codes: readonly string[]) {
    return new Map(
      codes.flatMap((code) => {
        const product = this.products.get(code);
        return product ? [[code, product] as const] : [];
      }),
    );
  }

  async findExistingProductIds(
    branchId: string,
    productIds: readonly string[],
  ) {
    return new Set(
      productIds.filter((productId) =>
        this.branchProducts.has(`${branchId}:${productId}`),
      ),
    );
  }

  async transaction<T>(
    operation: (transaction: this) => Promise<T>,
  ): Promise<T> {
    this.transactionCalls++;
    return operation(this);
  }

  async insertIfAbsent(row: BranchPriceImportRow): Promise<boolean> {
    const key = `${row.branchId}:${row.productId}`;
    if (this.branchProducts.has(key)) return false;
    this.branchProducts.set(key, row);
    return true;
  }
}

describe('runBranchPriceImport', () => {
  it('creates initial inactive, non-promotional branch product prices', async () => {
    const store = new InMemoryBranchPriceImportStore();

    await expect(
      runBranchPriceImport(store, [header, parsley, oregano].join('\n')),
    ).resolves.toEqual({
      created: 2,
      existing: 0,
      rejected: 0,
      errors: [],
    });
    expect(
      store.branchProducts.get('branch-vergara:product-parsley'),
    ).toMatchObject({
      price: '18000.00',
      isAvailable: false,
      isOnSale: false,
      isFeatured: false,
      promotionalPrice: null,
    });
  });

  it('is idempotent and never overwrites existing prices or flags', async () => {
    const store = new InMemoryBranchPriceImportStore();
    await runBranchPriceImport(store, [header, parsley].join('\n'));
    store.branchProducts.set('branch-vergara:product-parsley', {
      branchId: 'branch-vergara',
      productId: 'product-parsley',
      price: '999.99',
      promotionalPrice: '899.99',
      isAvailable: true,
      isOnSale: true,
      isFeatured: true,
    });

    await expect(
      runBranchPriceImport(store, [header, parsley, oregano].join('\n')),
    ).resolves.toMatchObject({
      created: 1,
      existing: 1,
      rejected: 0,
    });
    expect(
      store.branchProducts.get('branch-vergara:product-parsley'),
    ).toMatchObject({
      price: '999.99',
      promotionalPrice: '899.99',
      isAvailable: true,
      isOnSale: true,
      isFeatured: true,
    });
  });

  it.each([
    ['unknown product code', parsley.replace('761', '999')],
    ['unknown branch', parsley.replace('vergara', 'missing')],
    ['invalid price', parsley.replace('18000', '-1')],
    ['duplicate CSV code', [parsley, parsley].join('\n')],
    ['malformed CSV quoting', parsley.replace('761', '76"1"')],
  ])('rejects %s before opening a transaction', async (_name, row) => {
    const store = new InMemoryBranchPriceImportStore();

    await expect(
      runBranchPriceImport(store, [header, row].join('\n')),
    ).resolves.toMatchObject({ created: 0, existing: 0 });
    expect(store.transactionCalls).toBe(0);
    expect(store.branchProducts.size).toBe(0);
  });

  it('runs dry-run without writes while reporting projected records', async () => {
    const store = new InMemoryBranchPriceImportStore();

    await expect(
      runBranchPriceImport(store, [header, parsley, oregano].join('\n'), {
        dryRun: true,
      }),
    ).resolves.toMatchObject({
      created: 2,
      existing: 0,
      rejected: 0,
    });
    expect(store.transactionCalls).toBe(0);
    expect(store.branchProducts.size).toBe(0);
  });
});
