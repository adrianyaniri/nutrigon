# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Storefront Shopper / Branch Customer**: Shoppers visiting physical branches or ordering remotely via mobile devices. They scan in-store QR codes or click branch-specific links, browse the local catalog with branch pricing and availability, assemble their cart, and transfer the final order directly to WhatsApp for fulfillment.
- **Branch Administrator**: Managers responsible for an individual branch. They configure local commercial settings: toggling master products on or off in their branch catalog and assigning local branch prices.
- **General Administrator**: The business owner or head administrator overseeing all three branches. They manage the master catalog (creating/editing products, names, categories, descriptions, images), system users, and global branch configurations.

## Product Purpose

Nutrigon provides a streamlined multi-branch web catalog and administrative platform for a three-location natural food store and cereal market ("dietética"). It enables customers to effortlessly view real-time branch catalogs and prepare orders for WhatsApp checkout, while providing administrators with a clean, decoupled catalog management system that eliminates redundant product entries across branches.

## Positioning

Unlike conventional e-commerce solutions that treat multi-location businesses as separate stores or force rigid inventory/checkout integrations, Nutrigon utilizes a strict Master Catalog vs. Branch Configuration pattern. Products exist once globally while prices and availability remain branch-isolated, with friction-free WhatsApp ordering tailored to local Argentinian consumer habits without requiring payment gateway or inventory overhead for the MVP.

## Operating Context

- **Physical Dietética Stores**: 3 distinct branches in Argentina (Centro, Norte, Sur) with varying regional pricing and local product assortments.
- **In-Store & Mobile Access**: In-store customers scan branch QR codes on physical displays or flyers using smartphone browsers; remote customers access web links shared on social media.
- **WhatsApp Integration**: Final cart items, quantities (including bulk gram weights such as 100g, 250g, 500g, 1kg), branch identifier, and calculated totals are formatted into a clean, pre-filled WhatsApp message sent directly to that branch's contact number.

## Capabilities and Constraints

- **Decoupled Catalog Architecture**: Master products (name, description, category, images) are created once by General Admin; Branch Admins only set branch visibility (active/hidden) and branch price.
- **Bulk & Unit Packaging**: Supports both packaged items and bulk products sold by weight with quick-select increments (100g, 250g, 500g, 1kg).
- **MVP Scope Boundaries**:
  - No transactional payment gateway in MVP; ordering hands off cleanly to WhatsApp.
  - No real-time inventory deduction or Cuora Neo scale sync in MVP.
  - WhatsApp messages do not automatically record completed accounting sales.
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Base UI / shadcn, TanStack Query, React Router v7, Supabase backend / NestJS API monorepo.

## Brand Commitments

- **Brand Name**: Nutrigon
- **Identity & Aesthetics**: Warm, grounded, minimalist dark mode (`#121316`) paired with golden wheat accents (`#F5B731`).
- **Core Symbol**: Golden wheat grain within a circular emblem seal (`docs/imagenes/nutrigonLogo.jpeg`).
- **Responsive Layout Stance**: Strict Mobile-First foundation paired with expansive dual-canvas desktop layouts (avoiding narrow centered phone columns on widescreen monitors).

## Evidence on Hand

- Functional requirements and MVP scoping: `docs/contexto_mvp_catalogo_sucursales.md`, `docs/requerimientos.md`.
- Architecture and frontend specs: `docs/architecture/08-frontend-public-catalog-and-pwa.md`.
- Design system and color tokens: `docs/design-system.md`, `apps/web/src/styles/globals.css`.
- Official brand mark: `docs/imagenes/nutrigonLogo.jpeg`.
- Google Stitch responsive prototypes: Project ID `6380877095149821037`.

## Product Principles

1. **Master Truth, Local Autonomy**: A product definition exists once globally; each branch independently controls whether it sells it and at what price.
2. **Zero Friction Ordering**: Customers should reach a prepared order in as few taps as possible, without mandatory sign-ups or payment barriers.
3. **True Mobile-First, Expansive Desktop**: Interfaces are optimized first for one-handed mobile shoppers in aisles, expanding gracefully into rich dual-pane desktop dashboards.
4. **Transparent Clarity**: Prices and availability always reflect the selected physical branch to prevent customer confusion at fulfillment.

## Accessibility & Inclusion

- Minimum touch target height of 44px (`min-h-[44px]`) on all mobile interactive elements.
- High-contrast text compliance on dark surfaces (`#121316`) and brand gold CTAs (`#F5B731`).
- Screen reader-accessible labels for bulk weight selectors, cart controls, and branch switchers.
