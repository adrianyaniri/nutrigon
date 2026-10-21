# Branches seed

The branches seed is explicit, independent from the administrative seed, and does not run on application startup or migrations.

It reads the intentionally empty `initialBranches` list in `apps/api/src/core/database/initial-branches.ts`. Add only approved, real branch records there.

Each record must satisfy this shape:

```ts
{
  name: string;
  slug: string; // lowercase letters, digits, and dashes; unique identity
  address?: string | null;
  phone?: string | null;
  whatsappNumber?: string | null;
  openingHours?: string | null;
}
```

`DATABASE_URL` is mandatory and must be a complete `postgres://` or `postgresql://` URL. The seed never uses a fallback connection string.

## Commands

```bash
# Local source execution
pnpm db:seed:branches

# Running API container; the image must already contain the built seed
docker compose exec api node dist/core/database/branches.seed.js

# Railway command, after deployment provides the built application and DATABASE_URL
pnpm --filter @nutrigon/api db:seed:branches:prod
```

The seed uses the unique `branches.slug` constraint with `ON CONFLICT DO NOTHING`. It creates missing branches, preserves every existing branch unchanged, and never deletes rows absent from the input list. It prints created, existing, and rejected counts without logging connection details.
