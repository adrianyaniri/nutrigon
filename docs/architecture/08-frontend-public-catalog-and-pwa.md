# 08 — Frontend Architecture: Public Catalog & PWA Implementation

## 1. Context & Architectural Overview

The Public Catalog (`/catalogo`) provides an accessible, mobile-first, installable (PWA) storefront for Nutrigon's dietética operations across multiple physical branches.

In accordance with:
- **ADR-001 (Modular Architecture)**: Clean separation of presentation, business logic, and data access.
- **ADR-002 (Branch-Segregated Pricing)**: Catalog and cart state are bound to the currently selected branch (`branchSlug`). Prices and product availability vary per branch.
- **Nutrigon Design System**: Dark-mode palette (`#121316` surface, `#F5B731` gold primary), self-hosted `Plus Jakarta Sans` & `Public Sans`, and 8px border radius (`ROUND_EIGHT`).

---

## 2. Atomic Design Hierarchy

Components follow atomic design principles to ensure high reusability, testability, and clear composition boundaries:

```
apps/web/src/
├── components/
│   ├── atoms/                     # Pure design primitives (no domain knowledge)
│   │   ├── badge.tsx              # Status & sale indicators ("Oferta")
│   │   ├── chip.tsx               # Touch-friendly filter pill (min-h-[44px])
│   │   ├── icon-button.tsx        # Round button with mandatory accessible name (size-11)
│   │   ├── price-tag.tsx          # Formatted currency with strikethrough for promotions
│   │   ├── product-image.tsx      # Aspect-square image with lazy loading & brand fallback
│   │   └── skeleton.tsx           # Reduced-motion compliant loading placeholder
│   │
│   └── molecules/                 # Generic compound widgets
│       ├── search-input.tsx       # Search box with icon & 16px mobile font (prevents iOS zoom)
│       ├── branch-switcher.tsx    # Segmented radiogroup control for switching branch
│       ├── sort-select.tsx        # Native accessible select with custom chevron
│       └── empty-state.tsx        # Resilient empty/error display with call to action
│
└── features/
    ├── cart/                      # Cart feature module
    │   ├── cart-reducer.ts        # Pure branch-scoped reducer & business rules
    │   ├── cart-context.ts        # Context contract
    │   ├── cart-provider.tsx      # State provider
    │   └── use-cart.ts            # Hook for consumption
    │
    └── catalog/                   # Domain module: Public Catalog
        ├── types.ts               # View models decoupled from raw database schemas
        ├── components/            # Domain organisms
        │   ├── catalog-header.tsx # Sticky bar with CSS order reordering and official brand logo
        │   ├── catalog-hero.tsx   # Welcome banner establishing natural dietética personality
        │   ├── catalog-footer.tsx # Footer with Instagram social link & multi-branch WhatsApp info
        │   ├── product-card.tsx   # Composes ProductImage, Badge, PriceTag, IconButton in uniform card
        │   ├── product-card-skeleton.tsx # Zero-layout-shift loading counterpart
        │   ├── category-chips.tsx # Horizontal scrollable chips for mobile viewports
        │   ├── category-nav.tsx   # Sticky vertical navigation for desktop sidebar
        │   └── product-grid.tsx   # Responsive grid with loading & empty states
        ├── lib/
        │   └── filter-products.ts # Pure search, sort, and category counting logic (TDD)
        ├── data/
        │   ├── catalog-repository.ts # Repository interface contract
        │   └── mock-catalog.ts    # In-memory mock with per-branch price multipliers
        └── pages/
            └── catalog-page.tsx   # Top-level page template syncing filters with URL
```

---

## 3. Responsive Dual-Canvas Strategy

In adherence to project responsive rules:
1. **Mobile (< 768px)**:
   - Header rearranges via CSS `order`: Brand + Cart on top row, Search on second row, Branch switcher on third row.
   - Categories render as a horizontal touch-scrolling chip bar (`CategoryChips`).
   - Products display in a compact 2-column fluid grid.
   - Touch targets strictly maintain `min-h-[44px]` (or `size-11` for icon buttons).
2. **Desktop (>= 768px / `md:`, `lg:`, `xl:`)**:
   - Header collapses into a single streamlined row: `[Brand | Branch Switcher | Search | Cart Button]`.
   - Categories render as a sticky left sidebar (`w-60`).
   - Products expand across 3 to 4 columns (`lg:grid-cols-3 xl:grid-cols-4`).
   - Viewport is constrained to `max-w-screen-xl mx-auto` with clean lateral padding.

---

## 4. State Management & URL Synchronization

### 4.1 URL as Source of Truth (`useCatalogFilters`)
Filter criteria are stored directly in query params:
- `?sucursal=centro` — Selected branch
- `?q=almendras` — Case- and accent-insensitive search query
- `?categoria=frutos-secos` — Selected category slug
- `?orden=price-asc` — Sorting (`popular`, `price-asc`, `price-desc`, `name-asc`)

**Benefits**: Shareable URLs, native browser back/forward history support, and state preservation when returning to an installed PWA.

### 4.2 Branch-Scoped Cart (`cartReducer`)
Cart state is explicitly scoped to a single branch (`state.branchSlug`). If a customer switches branches while holding items, the cart is reset because prices and branch stocks are strictly segregated per branch.

---

## 5. Repository Pattern & Backend Transition Plan

UI components never fetch directly from HTTP or Supabase. They interact with `CatalogRepository`:

```typescript
export interface CatalogRepository {
  getBranches(): Promise<CatalogBranch[]>;
  getBranchCatalog(branchSlug: string): Promise<BranchCatalog>;
}
```

### Transition to Real API:
When `apps/api` implements the public endpoints (e.g. `GET /api/v1/public/catalog?branch=:slug`):
1. Create `apps/web/src/features/catalog/data/http-catalog-repository.ts`.
2. Swap the exported instance in `catalog-repository.ts`.
3. All UI components, hooks, tests, and formatting remain 100% untouched.

---

## 6. Progressive Web App (PWA) Setup

- **Plugin**: `vite-plugin-pwa` with Workbox service worker generation.
- **Manifest**: Located in `apps/web/vite.config.ts`, registered with standalone mode, dark theme `#121316`, and portrait orientation.
- **Caching Policies**:
  - App shell, bundle assets, and self-hosted WOFF2 fonts are pre-cached.
  - Product photos are cached at runtime with `CacheFirst` strategy (max 120 entries, 30 days expiration).
- **Safe Area**: Viewport meta includes `viewport-fit=cover` and CSS uses `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`.

### How to Update the Official Brand Logo:
1. Place the official vector SVG or high-resolution PNG (at least 512x512) at:
   `apps/web/public/icon.svg`
2. Run the PWA generator script:
   ```powershell
   pnpm --filter @nutrigon/web generate-pwa-assets
   ```
3. This automatically regenerates:
   - `apps/web/public/favicon.ico`
   - `apps/web/public/apple-touch-icon-180x180.png`
   - `apps/web/public/pwa-64x64.png`
   - `apps/web/public/pwa-192x192.png`
   - `apps/web/public/pwa-512x512.png`
   - `apps/web/public/maskable-icon-512x512.png`

---

## 7. Verification & Testing

Every layer has automated coverage via Vitest:
- Pure business logic (`filter-products.test.ts`, `cart-reducer.test.ts`)
- Component rendering and interaction (`product-card.test.tsx`)
- Full page integration with TanStack Query and MemoryRouter (`catalog-page.test.tsx`)

To run validation:
```powershell
pnpm turbo run lint typecheck test
```
