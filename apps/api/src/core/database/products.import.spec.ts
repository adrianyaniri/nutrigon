import { describe, expect, it } from 'vitest';
import {
  runProductImport,
  type ProductImportStore,
  type ProductImportRow,
} from './products.import.js';

const header =
  'code,name,category_slug,sale_unit,weight_options_grams,default_weight_grams,price_reference_grams,is_active,description';
const unit = 'U-1,Unit product,foods,UNIT,,,,true,Description';
const spices = 'W-1,Spice,foods,WEIGHT,25;50;75;100,25,100,true,';
const bulk = 'W-2,Nuts,foods,WEIGHT,100;250;500;1000,250,1000,true,';

class InMemoryProductImportStore implements ProductImportStore {
  readonly categories = new Map([['foods', 'category-1']]);
  readonly products = new Map<string, ProductImportRow>();
  transactionCalls = 0;
  failTransaction = false;

  async findCategoryIds(slugs: readonly string[]) {
    return new Map(slugs.flatMap((slug) => {
      const id = this.categories.get(slug);
      return id ? [[slug, id] as const] : [];
    }));
  }

  async transaction<T>(operation: (transaction: this) => Promise<T>): Promise<T> {
    this.transactionCalls++;
    if (this.failTransaction) throw new Error('transaction failed');
    return operation(this);
  }

  async insertIfAbsent(product: ProductImportRow): Promise<boolean> {
    if (this.products.has(product.code)) return false;
    this.products.set(product.code, product);
    return true;
  }
}

describe('runProductImport', () => {
  it('imports new UNIT and WEIGHT products with both supported weight groups', async () => {
    const store = new InMemoryProductImportStore();
    const result = await runProductImport(store, [header, unit, spices, bulk].join('\n'));

    expect(result).toMatchObject({ created: 3, existing: 0, rejected: 0 });
    expect(store.products.get('U-1')).toMatchObject({ saleUnit: 'UNIT' });
    expect(store.products.get('W-1')).toMatchObject({ weightOptionsGrams: [25, 50, 75, 100] });
    expect(store.products.get('W-2')).toMatchObject({ weightOptionsGrams: [100, 250, 500, 1000] });
  });

  it('is incremental and never overwrites an existing product', async () => {
    const store = new InMemoryProductImportStore();
    await runProductImport(store, [header, unit].join('\n'));
    store.products.set('U-1', { ...store.products.get('U-1')!, name: 'Existing product' });

    await expect(runProductImport(store, [header, unit, spices].join('\n'))).resolves.toMatchObject({
      created: 1,
      existing: 1,
      rejected: 0,
    });
    expect(store.products.get('U-1')?.name).toBe('Existing product');
  });

  it.each([
    ['duplicate code', [header, unit, unit].join('\n')],
    ['missing category', [header, unit.replace('foods', 'missing')].join('\n')],
    ['invalid weight configuration', [header, spices.replace('25;50;75;100,25,100', '25;50,75,100')].join('\n')],
  ])('rejects %s before opening a transaction', async (_name, csv) => {
    const store = new InMemoryProductImportStore();

    await expect(runProductImport(store, csv)).resolves.toMatchObject({ created: 0, existing: 0 });
    expect(store.transactionCalls).toBe(0);
    expect(store.products.size).toBe(0);
  });

  it('surfaces transaction failures without mutating its input', async () => {
    const store = new InMemoryProductImportStore();
    store.failTransaction = true;

    await expect(runProductImport(store, [header, unit].join('\n'))).rejects.toThrow('transaction failed');
    expect(store.products.size).toBe(0);
  });
});
