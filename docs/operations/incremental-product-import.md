# Incremental product import

The product importer is explicit and independent from the administrative seed. It inserts master products only; it never creates or changes `branch_products`, prices, users, or existing products.

## Required CSV format

```csv
code,name,category_slug,sale_unit,weight_options_grams,default_weight_grams,price_reference_grams,is_active,description
```

- `code` is mandatory and is the stable import identity.
- `sale_unit` is `UNIT` or `WEIGHT`.
- `WEIGHT` rows require semicolon-delimited positive integer options, a default included in those options, and a reference of `100` or `1000`.
- `UNIT` rows leave all three weight fields empty.
- `category_slug` must already exist. The importer never falls back to another category.
- No branch price column is accepted; prices remain independently managed per branch and stored per kilogram.

## Duplicate preflight before migration

The proposed partial unique index permits any number of existing `NULL` codes but rejects repeated non-null codes. Before applying the generated migration, run this **read-only** query against the intended database:

```sql
SELECT code, count(*)
FROM products
WHERE code IS NOT NULL
GROUP BY code
HAVING count(*) > 1;
```

If rows are returned, stop. Resolve the duplicates manually through an approved catalog-data operation; the migration and importer never alter existing data to repair them.

## Commands

```bash
# Local source execution; both variables must be explicit
DATABASE_URL=postgresql://... PRODUCTS_CSV_PATH=./path/to/products.csv pnpm db:import:products

# Built image / Railway command
DATABASE_URL=postgresql://... PRODUCTS_CSV_PATH=/app/data/products.csv pnpm --filter @nutrigon/api db:import:products:prod
```

The import validates the complete file and category references before it opens its write transaction. Any invalid row rejects the file without inserts. For a valid file, the database unique constraint and `ON CONFLICT DO NOTHING` make repeated executions report existing products rather than update or duplicate them.
