import { describe, expect, it } from 'vitest';
import {
  getRequiredSeedDatabaseUrl,
  runBranchesSeed,
  type BranchSeedStore,
} from './branches.seed.js';
import { initialBranches } from './initial-branches.js';

const branch = {
  name: 'Central',
  slug: 'central',
  address: 'Main Street 1',
  phone: '+541112345678',
  whatsappNumber: '+5491112345678',
  openingHours: 'Mon-Fri 09:00-18:00',
};

class InMemoryBranchSeedStore implements BranchSeedStore {
  readonly rows = new Map<string, (typeof branch & { marker?: string })>();

  async transaction<T>(operation: (transaction: this) => Promise<T>): Promise<T> {
    return operation(this);
  }

  async insertIfAbsent(input: typeof branch): Promise<boolean> {
    if (this.rows.has(input.slug)) return false;
    this.rows.set(input.slug, { ...input });
    return true;
  }
}

describe('runBranchesSeed', () => {
  it('defines the approved initial branches with stable slugs', () => {
    expect(initialBranches).toEqual([
      {
        name: 'Nutrigon Vergara',
        slug: 'vergara',
        address: 'Av. Vergara 2395, Villa Tesei, Hurlingham',
      },
      {
        name: 'Nutrigon Villegas',
        slug: 'villegas',
        address: 'Gral. Conrado Villegas 1971, William Morris, Hurlingham',
      },
      {
        name: 'Nutrigon Origone',
        slug: 'origone',
        address: 'Tte. Manuel Origone 18, Villa Tesei, Hurlingham',
      },
    ]);
  });

  it('requires an explicit complete PostgreSQL DATABASE_URL', () => {
    expect(() => getRequiredSeedDatabaseUrl(undefined)).toThrow(
      'DATABASE_URL must be explicitly configured to run the branches seed',
    );
    expect(() => getRequiredSeedDatabaseUrl('https://example.com')).toThrow(
      'DATABASE_URL must be a complete PostgreSQL connection URL',
    );
  });

  it('inserts initial branches and reports created records', async () => {
    const store = new InMemoryBranchSeedStore();

    await expect(runBranchesSeed(store, [branch])).resolves.toEqual({
      created: 1,
      existing: 0,
      rejected: 0,
    });
    expect(store.rows.get('central')).toMatchObject(branch);
  });

  it('is idempotent across a second execution', async () => {
    const store = new InMemoryBranchSeedStore();

    await runBranchesSeed(store, [branch]);

    await expect(runBranchesSeed(store, [branch])).resolves.toEqual({
      created: 0,
      existing: 1,
      rejected: 0,
    });
  });

  it('adds a new branch without duplicating existing branches', async () => {
    const store = new InMemoryBranchSeedStore();
    const secondBranch = { ...branch, name: 'North', slug: 'north' };

    await runBranchesSeed(store, [branch]);
    await expect(runBranchesSeed(store, [branch, secondBranch])).resolves.toEqual({
      created: 1,
      existing: 1,
      rejected: 0,
    });
    expect([...store.rows.keys()]).toEqual(['central', 'north']);
  });

  it('preserves existing branch data', async () => {
    const store = new InMemoryBranchSeedStore();
    store.rows.set('central', { ...branch, name: 'Existing name', marker: 'keep' });

    await runBranchesSeed(store, [branch]);

    expect(store.rows.get('central')).toMatchObject({ name: 'Existing name', marker: 'keep' });
  });

  it('rejects invalid entries without writing them', async () => {
    const store = new InMemoryBranchSeedStore();

    await expect(runBranchesSeed(store, [{ ...branch, slug: 'NOT VALID' }])).resolves.toEqual({
      created: 0,
      existing: 0,
      rejected: 1,
    });
    expect(store.rows.size).toBe(0);
  });

  it('never removes branches absent from the input list', async () => {
    const store = new InMemoryBranchSeedStore();
    store.rows.set('legacy', { ...branch, name: 'Legacy', slug: 'legacy' });

    await runBranchesSeed(store, []);

    expect(store.rows.get('legacy')).toBeDefined();
  });
});
