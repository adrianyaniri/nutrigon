# PostHog analytics for the storefront

PostHog records consented public-catalog usage and session replays. It does not record confirmed sales: the WhatsApp handoff only indicates checkout intent.

## Configure

Set these **build-time** variables for the web service in Railway, then rebuild the frontend:

| Variable | Value |
| --- | --- |
| `VITE_POSTHOG_KEY` | The public PostHog project token, not a personal or private API key. |
| `VITE_POSTHOG_HOST` | The ingestion host for the project's region, for example `https://us.i.posthog.com` or `https://eu.i.posthog.com`. |

The frontend must be a production build (`VITE_APP_ENV=production` or Vite's production-mode default). Missing PostHog variables, non-production builds, local domains, and IP-literal hosts disable collection. Use a separate PostHog test project if ingestion testing is needed.

## Verify in PostHog

1. On the deployed public catalog, open the **Privacy** control and accept analytics. Before acceptance, confirm in browser DevTools that no requests go to the PostHog host.
2. Visit `/catalogo` and a branch catalog, then change a search or category filter. In PostHog **Activity → Live events**, confirm one `$pageview` per pathname, with no query string; filter-only changes should not create another pageview.
3. Open a product, add it, open the cart, and click the WhatsApp checkout button. Confirm `product_viewed`, `add_to_cart`, `checkout_started`, and `whatsapp_checkout_clicked` respectively. The last event is **not** a sale.
4. In **Session Replay**, inspect a recording: all text and inputs should be masked, URLs should omit query strings, and network bodies and headers should be absent. Check the recording itself before relying on this configuration.
5. Reject or revoke consent with **Privacy**, reload, and confirm no events or replay are sent. Repeat with the PostHog variables omitted to confirm the catalog and WhatsApp flow still work.

## Event contract

| Event | Trigger | Properties |
| --- | --- | --- |
| `$pageview` | Initial public route and pathname changes after consent | Sanitized `$current_url` |
| `product_viewed` | Product detail modal opens from a customer action | `product_id`, `product_category` (existing category ID) |
| `add_to_cart` | Cart add action is dispatched | `product_id`, `quantity` |
| `checkout_started` | A non-empty cart drawer opens | `cart_items_count` |
| `whatsapp_checkout_clicked` | Valid checkout opens WhatsApp | `cart_items_count` |

No names, phone numbers, addresses, notes, cart message, or WhatsApp URL are event properties. Auto-captured clicks and automatic pageviews are disabled. The opt-in banner covers analytics **and** replay; admin routes are not instrumented. Replays use mask-all text and input settings, exclude body and header capture, and redact URL queries. Keep those defaults when changing the catalog.

## Operational limits

- Consent is stored per browser origin; visitors may reject and later change it through **Privacy**.
- Ad blockers, browser restrictions, or PostHog outages may prevent delivery. Checkout does not wait for analytics.
- Sessions and new/recurrent visitors are PostHog's anonymous browser-level metrics, not confirmed human identities or completed orders.
- Configure any dashboards and replay retention in the PostHog UI; this integration creates none.
