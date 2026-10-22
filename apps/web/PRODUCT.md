# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary: customers browsing the public catalog for a chosen Nutrigon branch and preparing an order to continue through WhatsApp. The user confirmed the catalog as the priority for future product decisions.
- Secondary: general administrators who maintain shared product information, and branch administrators who configure their own branch's prices and publication status.

## Product Purpose

Nutrigon provides a public product catalog for a dietética with three physical branches. Customers select a branch, see its published products and prices, prepare a cart, and continue the order through WhatsApp. The administrative interface maintains the catalog behind that customer journey.

## Positioning

One shared master product catalog supports branch-specific publication and prices without duplicating product records. The public experience shows only the chosen branch's published offers.

## Operating Context

- Customers can enter through the public landing page, a branch catalog link, or a QR code; the final QR destination policy is not yet settled in the MVP brief.
- Branches may offer different products and prices. Customers select quantities for products sold by unit or weight before continuing through WhatsApp.
- General administrators create and edit shared product information. Branch administrators configure the commercial details of their assigned branch.

## Capabilities and Constraints

- The MVP includes public branch catalogs, product information and images, branch-specific prices and visibility, administrative management, and a cart that generates a WhatsApp message.
- Preparing or sending a WhatsApp order is not a recorded sale and must not change stock.
- Inventory, sales recording, payments, invoicing, and WhatsApp Business API integration are outside the confirmed catalog MVP.
- A new master product is not automatically published in every branch; a branch must enable it and provide a valid price.
- The web interface is mobile-first and must adapt to larger screens. Interactive controls require at least 44 px touch height under the repository rules.

## Brand Commitments

- The product and business name is Nutrigon, presented in the public interface as “Nutrigon” and “Dietética & Cerealera.”
- An existing logo is available at `apps/web/public/Logo.jpeg`.
- Public-facing copy and workflows currently use Spanish. Preserve factual business copy unless the owner changes it.

## Evidence on Hand

- `docs/contexto_mvp_catalogo_sucursales.md` records the agreed catalog MVP, roles, branch rules, and exclusions.
- `docs/requerimientos.md` is a broader draft with items still pending client validation; it does not expand the confirmed catalog MVP by itself.
- `apps/web/src/app/router/routes.tsx` and `apps/web/src/features/catalog/pages/catalog-landing-page.tsx` show the implemented public and administrative entry points.
- `apps/web/public/Logo.jpeg` is the existing brand asset. No customer testimonials, performance claims, or sales proof were established for future copy.

## Product Principles

1. Prioritize the customer's branch-specific catalog journey over administrative convenience when product decisions conflict.
2. Keep shared product identity separate from branch-specific publication and prices.
3. Make WhatsApp handoff explicit; never imply that preparing an order completed a sale.
4. Preserve a usable mobile journey while supporting wider screens.
