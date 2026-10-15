# 08 — Frontend Architecture: Public Catalog & PWA Implementation

## 1. Context & Architectural Overview

The Public Catalog (`/catalogo`) provides an accessible, mobile-first, installable (PWA) storefront for Nutrigon's dietética operations across multiple physical branches.

In accordance with:
- **ADR-001 (Modular Architecture)**: Clean separation of presentation, business logic, and data access.
- **ADR-002 (Branch-Segregated Pricing)**: Catalog and cart state are bound to the currently selected branch (`branchSlug`). Prices and product availability vary per branch.
- **Physical QR Storefront Strategy**: Each branch displays physical QR codes linking directly to their branch-scoped catalog (`/catalogo/:branchSlug`).
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
        │   ├── catalog-header.tsx # Responsive bar with brand logo & compact branch picker trigger
        │   ├── branch-picker-modal.tsx # Accessible modal with cart-reset warning on branch change
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
            ├── catalog-landing-page.tsx # Branch selector landing for /catalogo root visitors
            └── catalog-page.tsx   # Branch catalog for /catalogo/:branchSlug
```

---

## 3. Responsive Dual-Canvas Strategy & Mobile Optimization

In adherence to project mobile-first rules:
1. **Mobile (< 768px)**:
   - Header is simplified into two compact rows:
     - Row 1: `[Brand Logo] [📍 Sucursal · Cambiar (Trigger)]` and `[Cart Button (right)]`.
     - Row 2: Full-width `SearchInput`.
   - Eliminating the wide segmented switcher freed ~50px of vertical header space on mobile.
   - Categories render as a horizontal touch-scrolling chip bar (`CategoryChips`).
   - Products display in a compact 2-column fluid grid.
   - Touch targets strictly maintain `min-h-[44px]` (or `size-11` for icon buttons).
2. **Desktop (>= 768px / `md:`, `lg:`, `xl:`)**:
   - Header collapses into a single streamlined row: `[Brand Logo | Branch Trigger | Search Input (flex-1) | Cart Button]`.
   - Categories render as a sticky left sidebar (`w-60`).
   - Products expand across 3 to 4 columns (`lg:grid-cols-3 xl:grid-cols-4`).
   - Viewport is constrained to `max-w-screen-xl mx-auto` with clean lateral padding.

---

## 4. Route-Based Branching & Physical QR Code Model

### 4.1 Canonical Branch URLs (`/catalogo/:branchSlug`)
Each physical dietética location prints its own QR code on counter displays and packaging:
- **Sucursal Centro**: `https://nutrigon.com/catalogo/centro`
- **Sucursal Norte**: `https://nutrigon.com/catalogo/norte`
- **Sucursal Sur**: `https://nutrigon.com/catalogo/sur`

Customers scanning the counter QR code land directly in the context of that specific branch with its catalog, prices, and direct WhatsApp contact without needing to select anything manually.

### 4.2 Generic Landing (`/catalogo`)
Visitors entering `/catalogo` without a route slug (e.g. from the homepage or direct typing) arrive at `CatalogLandingPage`:
- Presents clear branch cards with address, operating hours, and specialty tags.
- Automatically detects and displays the last visited branch from `localStorage` (`nutrigon:last-branch`) with a quick "Continuar allí" action.

### 4.3 Switching Branches & Cart Invalidation Guard
Because product prices and inventory differ across branches (ADR-002), the header provides a discrete `📍 Sucursal [Nombre] · Cambiar` trigger that opens `BranchPickerModal`:
- If the cart already contains items, an alert warns the customer:
  > *"Tenés X productos en tu pedido. Al cambiar de sucursal se vaciará el carrito, ya que los precios y disponibilidad son propios de cada sucursal."*
- Confirming a branch change clears the cart, updates `localStorage`, and routes cleanly to `/catalogo/:newBranchSlug`.

### 4.4 URL Query Parameters (`useCatalogFilters`)
Filter criteria within a branch are stored in standard query params:
- `?q=almendras` — Case- and accent-insensitive search query
- `?categoria=frutos-secos` — Selected category slug
- `?orden=price-asc` — Sorting (`popular`, `price-asc`, `price-desc`, `name-asc`)

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

---

## 7. Verification & Testing

Every layer has automated coverage via Vitest:
- Pure business logic (`filter-products.test.ts`, `cart-reducer.test.ts`)
- Component rendering and interaction (`product-card.test.tsx`)
- Full page and route integration (`catalog-page.test.tsx`):
  - Canonical branch route rendering
  - Search and category query filtering
  - Modal branch switching and URL navigation
  - Invalid branch fallback view
  - Generic `/catalogo` landing page

To run validation:
```powershell
pnpm turbo run lint typecheck test
```
