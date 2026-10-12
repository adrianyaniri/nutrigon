---
name: stitch-responsive-design
description: >
  Guidelines and workflows for designing responsive screens in Google Stitch using Stitch MCP.
  Ensures agents generate both mobile and expansive desktop web screens, avoiding narrow mobile-only layouts on desktop.
  Trigger: When designing, generating, adapting, or editing screens in Google Stitch or using Stitch MCP.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Generating new UI screens or prototypes using Google Stitch and the Stitch MCP server (`@_davideast/stitch-mcp`).
- Adapting mobile-first designs to wide desktop web displays.
- Reviewing Stitch projects to ensure full responsive viewport coverage.

## Critical Patterns

### 1. Dual Canvas Requirement (Mobile + Desktop Web)

Every UI screen generated in Stitch MUST have both a mobile version and an expansive desktop web version:
- **Mobile (`deviceType: "MOBILE"`):** Single-column, stacked layout, bottom navigation or collapsible drawer, touch-friendly touch targets (`min-h-[44px]`).
- **Desktop (`deviceType: "DESKTOP"`):** Full-width viewport utilization, multi-column layouts, sticky sidebar navigation or filters, 3 to 4 column product/card grids, split hero sections, and detailed footers.

### 2. Prohibited Desktop Anti-Pattern: Centered Mobile Strip

Never generate desktop screens as a narrow, single-column container floating in the middle of a 1440px/1920px canvas with massive empty lateral gutters.

| Area | Mobile Layout (`MOBILE`) | Desktop Web Layout (`DESKTOP`) |
| :--- | :--- | :--- |
| **Header** | Logo, compact search icon, hamburger menu | Full-width sticky header, expanded search bar, branch selector dropdown, quick links, cart badge |
| **Hero** | Vertical banner with stacked headline & CTA | Split layout: Value proposition & CTAs on left, photographic visual on right |
| **Catalog / List** | 1–2 column card grid, horizontal scrolling chips | Sticky left sidebar for filters (`~280px`), 3–4 column responsive grid in main area |
| **Cart / Checkout** | Stacked full-width list | 2-column layout: Items list on left, sticky order summary & checkout form on right |
| **Footer** | Minimal collapsed links | Full multi-column footer with branch locations, hours, policies, and contact |

### 3. Stitch MCP Execution Best Practices

When calling Stitch MCP tools via `npx @_davideast/stitch-mcp tool`:
- **`deviceType` enum MUST be uppercase:** Use `"MOBILE"` or `"DESKTOP"`. Lowercase (`"mobile"`, `"desktop"`) will fail with invalid argument.
- **Model Selection:** Default to `"GEMINI_3_8_FLASH"`.
- **Authentication:** Ensure `STITCH_API_KEY` is present in the environment.
- **Screen IDs:** Strip any `screens/` prefix (pass only the 32-character hex ID, e.g. `c264c8f75e2b48d996d04e1b233a1df4`).
- **Project IDs:** Strip any `projects/` prefix (e.g. `16032207643262590460`).

## Code Examples

### Generating a Desktop Screen (`generate_screen_from_text`)

```javascript
const { execSync } = require('child_process');
const fs = require('fs');

const payload = {
  projectId: "16032207643262590460",
  prompt: "Expansive responsive DESKTOP layout for Nutrigon home screen. Multi-column structure: left sidebar filters (~280px), 4-column product grid, split horizontal hero, sticky full-width navbar with branch selector.",
  deviceType: "DESKTOP",
  modelId: "GEMINI_3_8_FLASH"
};

fs.writeFileSync("payload.json", JSON.stringify(payload));
const output = execSync('npx @_davideast/stitch-mcp tool generate_screen_from_text -f payload.json', {
  env: process.env
}).toString();
```

### Adapting an Existing Mobile Screen to Desktop (`edit_screens`)

```javascript
const payload = {
  projectId: "16032207643262590460",
  selectedScreenIds: ["<screen-id-without-prefix>"],
  deviceType: "DESKTOP",
  modelId: "GEMINI_3_8_FLASH",
  prompt: "Adapt this screen to wide DESKTOP web view. Reorganize content into two columns: sticky filter sidebar on left, 4-column product grid on right. Expand navbar and footer to full viewport width without lateral empty space."
};
```

## Commands

```bash
# List tools
npx @_davideast/stitch-mcp tool

# List project screens
npx @_davideast/stitch-mcp tool list_screens -d '{"projectId":"<projectId>"}'

# Extract generated HTML code for a screen
npx @_davideast/stitch-mcp tool get_screen_code -d '{"projectId":"<projectId>","screenId":"<screenId>"}'
```
