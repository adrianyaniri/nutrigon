# Product weights and price references

Weight products can define their available portions, initial portion and price reference. Branches keep independent prices, always stored per kilogram. Unit products and combos keep their existing pricing behavior.

## Configure a product

In the master product editor, choose a preset or enter comma-separated integer gram amounts. The initial weight must belong to that list. Choose either a 1 kg or 100 g price reference; each branch editor uses that reference for regular and promotional input.

| Example | Available grams | Initial grams | Price reference |
| --- | --- | --- | --- |
| Nuts | 100, 250, 500, 1000 | 250 | 1 kg |
| Spices | 25, 50, 75, 100 | 25 | 100 g |

Changing the reference never rewrites existing branch prices. For example, entering $1050 per100 g stores $10500 perkg. An unchanged reference amount is saved without converting its rounded display back into a different stored price.

## Amounts and checkout

- Calculate proportional prices using integer cents and round half up only when a portion requires a fraction of a cent. There is no rounding to tens of pesos.
- At $1050 per100 g, 25 g costs $262.50, 50 g costs $525, and 75 g costs $787.50.
- A cart line contains a number of packages of the chosen weight. Multiply the cent-valued package price by package count, then sum line totals in cents. Half-cent boundaries are rounded per package, not by recomputing the combined weight.
- Cards state the price reference and the smallest available portion. Detail, cart and WhatsApp show the selected weight and matching total. WhatsApp also includes total weight and package price.
- A missing or no-longer-available portion blocks checkout until the affected line is removed and selected again. The application never assumes a missing portion means 100 g.
- Checkout still opens an estimated WhatsApp request; it does not create or confirm a server-side order or reserve stock.

## Database rollout

Migration `apps/api/drizzle/0003_special_ultimates.sql` adds product settings with legacy defaults: 100/250/500/1000 g, initial 250 g, reference 1000 g. It does not change branch prices. Apply it through the existing authorized database rollout before deploying the API that reads the new columns. The feature implementation does not apply this migration to a database automatically.

## Verification

Focused tests cover contracts, merged partial updates, price conversion, spice selection, existing kg and unit flows, invalid cart portions and WhatsApp totals. Run the repository gate with `pnpm turbo run lint typecheck test`.
