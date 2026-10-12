# Supabase Migrations

Store declarative SQL migration files here following timestamp naming conventions:
`YYYYMMDDHHMMSS_description.sql`

## Rules
- Never run ad-hoc migrations directly against production database without tracking.
- All schema changes must include Row Level Security (RLS) policies.
- Business migrations will be created in subsequent phases after validating requirement decisions.
