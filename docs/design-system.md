# Nutrigon Design System

Centralized design tokens, visual guidelines, and component specifications derived from the official brand identity and Google Stitch prototypes.

---

## 1. Brand Identity & Philosophy

- **Brand Name:** Nutrigon
- **Domain:** Dietética Natural & Cerealera
- **Symbol:** Golden wheat grain within a circular seal (`docs/imagenes/nutrigonLogo.jpeg`)
- **Aesthetic Direction:** Warm, grounded, minimalist dark mode (`#121316`), organic yet structured.
- **Responsive Stance:** Mobile-First foundation with dual-canvas expansive layouts on desktop (avoiding centered single-column mobile views on widescreen displays).

---

## 2. Color Palette & Semantic Tokens

All tokens are defined in `apps/web/src/styles/globals.css` using Tailwind CSS v4 `@theme inline` and standard CSS variables for seamless integration with shadcn and Base UI components.

### 2.1 Core Brand Colors

| Token Name | Hex Value | Role & Usage |
| :--- | :--- | :--- |
| `--color-brand-gold` (`primary`) | `#F5B731` | Brand signature, primary CTAs, active filters, price tags, indicators. |
| `--color-brand-gold-hover` | `#E5A820` | Hover & focus states for primary interactive elements. |
| `--color-brand-dark` | `#121316` | Base dark canvas and high-contrast text on primary buttons (`on-primary`). |
| `--color-brand-surface` | `#1A1D24` | Sidebar containers, secondary card backgrounds. |
| `--color-brand-card` | `#1E222B` | Interactive product card containers and list rows. |
| `--color-brand-border` | `#2A2E39` | Subtle borders, dividers, chip outlines. |
| `--color-brand-muted` | `#94A3B8` | Secondary labels, package weight hints, metadata text. |

### 2.2 Surface Elevation (Dark Mode)

| Surface Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `--color-surface` / `--background` | `#121316` | Main viewport background. |
| `--color-surface-modal` / `--popover`| `#16171B` | Drawers, dialog overlays, bottom sheets. |
| `--color-surface-card` / `--card` | `#1A1C20` | Base card background, table containers. |
| `--color-surface-elevated` | `#22252B` | Hovered cards, dropdown menus, secondary buttons. |
| `--color-surface-hover` | `#2A2E36` | Active item highlight state. |
| `--color-outline` / `--border` | `#2F333D` | Default structural border. |
| `--color-outline-variant` | `#3F4452` | Emphasized or focused borders. |

### 2.3 Status & Feedback

| Status Token | Hex Value | Dim Background | Usage |
| :--- | :--- | :--- | :--- |
| `status-success` | `#34D399` | `rgba(52, 211, 153, 0.15)` | In-stock badges, order confirmations, active state. |
| `status-warning` | `#FBBF24` | `rgba(251, 191, 36, 0.15)` | Low stock warnings, pending verification. |
| `status-info` | `#60A5FA` | `rgba(96, 165, 250, 0.15)` | Informational hints, branch notifications. |
| `status-destructive` | `#EF4444` | `rgba(239, 68, 68, 0.15)` | Out of stock, delete actions, validation errors. |

---

## 3. Typography System

Self-hosted via `@fontsource-variable` to ensure offline capability, privacy, and optimal loading performance without external Google Fonts dependencies.

| Role | Font Family | Weights Used | Usage |
| :--- | :--- | :--- | :--- |
| **Body & UI (`font-sans`, `font-body`)** | `Plus Jakarta Sans Variable` | 300, 400, 500, 600, 700 | Product descriptions, prices, buttons, inputs, tables, nutritional facts. |
| **Headings (`font-headline`, `font-display`)** | `Public Sans Variable` | 500, 600, 700, 800 | Page titles, modal headers, section titles, category names. |

### Hierarchy

- **Page Title (Desktop H1):** `text-xl md:text-2xl font-bold tracking-tight text-white`
- **Section Heading (H2):** `text-base md:text-lg font-semibold text-white`
- **Card Title (H3):** `text-sm font-medium text-zinc-100 group-hover:text-brand-gold`
- **Body & Controls:** `text-xs md:text-sm font-normal`
- **Microcopy / Weight hints:** `text-[11px] font-medium text-zinc-500`

---

## 4. Spacing, Shapes & Interactive Rules

- **Corner Radius:**
  - `sm`: `0.25rem` (4px) — Small badges, inline tags.
  - `md`: `0.375rem` (6px) — Inputs, select triggers.
  - `lg`: `0.5rem` (8px) — Standard cards, modals, buttons (`ROUND_EIGHT`).
  - `xl`: `0.75rem` (12px) — Image containers, elevated panels.
  - `full`: `9999px` — Branch switcher pills, category chips, circular icon buttons.
- **Touch Target:** Minimum height of `44px` (`min-h-[44px]`) on all mobile interactive elements.
- **Scrollbars:** Sleek dark scrollbars (`8px` width, thumb `#2A2E39`, track `#121316`).

---

## 5. Screen Inventory & Architecture Mapping (Google Stitch)

**Project ID:** `6380877095149821037`  
**Theme:** Dark mode, Gold primary accent, Plus Jakarta Sans typography.

### 5.1 Public Experience (Catalog, Cart & Checkout)

| Screen Name | Device | Screen ID | Key Components |
| :--- | :--- | :--- | :--- |
| **Nutrigon - Catálogo Móvil Minimalista** | `MOBILE` | `65231c47ada74f3098ca7fa9c0cf7f62` | Header with branch badge, search bar, horizontal category chips, 2-column product grid, bottom sticky cart bar. |
| **Nutrigon - Catálogo Desktop Minimalista** | `DESKTOP` | `546d6933040d4a918fd22eeb21dae35f` | Sticky top header with branch switcher, sticky left filter sidebar (`w-64`), 4-column product grid, sort dropdown. |
| **Nutrigon - Modal de Producto Móvil** | `MOBILE` | `7325fddf7b644b4a85081bd5ca59cdff` | Bottom sheet with product image, bulk quantity selector chips (100g, 250g, 500g, 1kg), dynamic price calculator. |
| **Nutrigon - Modal de Producto Minimalista** | `DESKTOP` | `27d94255ce594e81bc968b6645f4d817` | Centered 2-column dialog: image preview on left, quantity selector, total and CTA on right. |
| **Nutrigon - Tu Pedido Móvil** | `MOBILE` | `1c549c2484154499853ab6ddaf9e3634` | Full-width item list, quantity counters, branch pickup notice, WhatsApp dispatch button. |
| **Nutrigon - Carrito Desktop Minimalista** | `DESKTOP` | `4a72c667a585468dbc3d2ca4625ba2b5` | 2-column layout: items list with thumbnails on left, sticky order summary & client contact form on right. |
| **Nutrigon - Confirmación WhatsApp** | `MOBILE` | `2c75bb3a705f40069f7ff1a12078f7b8` | Success state card, order breakdown summary, "Abrir en WhatsApp" CTA button. |
| **Nutrigon - Flujo Público Interactivo** | `DESKTOP` | `28ff7041c9db492d8304f46be2a2a236` | Prototype linking Catalog, Product Modal, and Drawer Cart into an interactive flow. |

### 5.2 Admin Portal (Catalog & Branch Pricing)

| Screen Name | Device | Screen ID | Key Components |
| :--- | :--- | :--- | :--- |
| **Nutrigon Admin - Inicio de Sesión Móvil** | `MOBILE` | `ee6d2aaa78ff45c09bc3c8fb708c61f3` | Centered auth card, email/password inputs, branch selector hint. |
| **Nutrigon Admin - Inicio de Sesión Desktop** | `DESKTOP` | `bf4f1e4865d648bdbd1a2516803a0108` | Split screen: branded branding hero on left, login form on right. |
| **Nutrigon Admin - Gestión Móvil Catálogo** | `MOBILE` | `b53e0507e46e424dad0f0e7160525ecf` | Compact product list with status badges (`ACTIVE`, `INACTIVE`), inline quick price update. |
| **Nutrigon Admin - Gestión Minimalista Desktop** | `DESKTOP` | `e61c736cc91a4563a6822b625cf82147` | Full-width data table, branch filter tabs, quick search, stock toggles, bulk price actions. |
| **Nutrigon Admin - Gestión con Drawer Interactivo** | `DESKTOP` | `d354907ac2f64a5f8d5ed7844d3ad73c` | Side drawer panel for editing master catalog attributes, branch prices, and image uploads. |
| **Nutrigon Admin - Flujo Completo Interactivo** | `DESKTOP` | `314805ec6cbe4906ac2f2735725d770f` | Complete end-to-end admin prototype flow. |

---

## 6. How to Use in Code

```tsx
// Example button using the centralized primary token
<button className="bg-primary text-primary-foreground hover:bg-brand-gold-hover px-4 py-2 rounded-lg font-semibold transition-colors">
  Agregar al Pedido
</button>

// Example card using surface tokens
<article className="bg-surface-card border border-outline rounded-lg p-4 hover:border-brand-gold transition-colors">
  <span className="text-xs text-brand-muted">Granel · 100g</span>
  <h3 className="font-headline text-white font-medium">Almendras Nonpareil</h3>
  <span className="text-brand-gold font-bold">$ 1.450</span>
</article>
```
