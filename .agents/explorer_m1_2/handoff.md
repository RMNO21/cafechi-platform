# Handoff Report: Milestone 1 — Customer Menu Theme Fidelity & 0-Leak Design System

**Agent**: Explorer 2 (Milestone 1)  
**Recipient**: Sub-Orchestrator M1 (`7bb1f960-843c-4713-8a81-da7d1d9f03e1`)  
**Date**: 2026-08-16  
**Type**: Hard Handoff (Investigation & Architecture Complete)

---

## 1. Observation

Direct code analysis of `src/app/c/[cafeSlug]/page.tsx`, `src/app/globals.css`, `src/lib/themes.ts`, and `src/app/owner/page.tsx` revealed the following exact observations:

1. **Hardcoded Colors in `src/app/c/[cafeSlug]/page.tsx`**:
   - `page.tsx:712-718`: `.cm-banner-viewonly { background: #FEF3C7; color: #92400E; border-bottom: 1px solid #FDE68A; }`
   - `page.tsx:750`: `.cm-usual-card { background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); }`
   - `page.tsx:863`: `.cm-item-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }`
   - `page.tsx:1172`: Out of stock badge `<div style={{ ... background: 'rgba(0,0,0,0.6)', color: '#fff' ... }}>`
   - `page.tsx:1225`: Floating cart badge `<span style={{ ... background: '#FFF', color: 'var(--theme-accent)' ... }}>`
   - `page.tsx:1234`: Floating cart button `<div style={{ ... background: 'rgba(0,0,0,0.2)' ... }}>`
   - `page.tsx:1245-1254`: Table Hub icons `<Bell style={{ color: '#F59E0B' }} />`, `<Receipt style={{ color: '#10B981' }} />`, `<Droplets style={{ color: '#3B82F6' }} />`, `<CreditCard style={{ color: '#8B5CF6' }} />`
   - `page.tsx:1261`: Table FAB button `style={{ background: tableHubOpen ? '#EF4444' : 'var(--theme-surface)', color: tableHubOpen ? '#FFF' : 'var(--theme-text)' }}`
   - `page.tsx:1373`: Modal checkmark icon `<div style={{ ... background: '#D1FAE5', color: '#059669' ... }}>`
   - `page.tsx:1389`: Modal receipt icon `<div style={{ ... background: '#DBEAFE', color: '#2563EB' ... }}>`

2. **Hardcoded Radiuses & Shadows in `src/app/c/[cafeSlug]/page.tsx`**:
   - `page.tsx:925`: `border-radius: 8px` on item plus button (violates 0px in `NEO_EDITORIAL` and soft radius in `WARM_TERRACOTTA`).
   - `page.tsx:949`: `border-radius: 16px` on `.cm-cart-bar`.
   - `page.tsx:954`: `box-shadow: 0 8px 30px rgba(0,0,0,0.25)` on `.cm-cart-bar`.
   - `page.tsx:1022-1029`: `border-top-left-radius: 24px; border-top-right-radius: 24px; box-shadow: 0 -8px 30px rgba(0,0,0,0.3)` on `.cm-drawer-sheet`.
   - `page.tsx:1045-1049`: `border-radius: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.25)` on `.cm-modal-card`.
   - `page.tsx:1280, 1287, 1300, 1307, 1339, 1341, 1357`: Inline `borderRadius` values `16px`, `4px`, `12px`, `14px`, `10px`.

3. **Coffee Radar Chart**:
   - `page.tsx:14-71`: `CoffeeRadar` component uses SVG canvas size `160px` with label text placement `getPoint(11.5, i, 10)`. Radius is 64px, causing label boundaries to reach 154px on a 160px box, risking text cutoff on smaller viewports.

4. **Owner Studio Lint Issue**:
   - `src/app/owner/page.tsx:572`: `const { THEMES } = require("@/lib/themes");` inside `ThemePreview` component function.

5. **Typecheck Baseline**:
   - `npx tsc --noEmit` runs with 0 errors.

---

## 2. Logic Chain

1. **Step 1 (Theme Ingestion)**: `src/app/c/[cafeSlug]/page.tsx` dynamically reads the active theme from `getTheme(cafe.themeId)` and applies `activeTheme.cssVars` on `.cm-root-wrapper`.
2. **Step 2 (Color Leak Detection)**: When child elements in `page.tsx` use hardcoded values (like `#FEF3C7`, `#D1FAE5`, `#DBEAFE`, `#FFF`, `#EF4444`, `rgba(255,255,255,0.15)`, `rgba(0,0,0,0.2)`), they bypass the CSS variable cascade.
3. **Step 3 (Theme Clash Analysis)**:
   - In `OLED_CARBON` (pitch black background `#080808`): Light pastel badges (`#FEF3C7`, `#D1FAE5`, `#DBEAFE`, `#FFF`) create harsh visual flashes and contrast failure.
   - In `NEO_EDITORIAL` (brutalist high-contrast monochrome with 0px radius and `4px 4px 0px #18181B` block shadow): Blurry hover shadows (`rgba(0,0,0,0.1)`) and curved corners (`16px`, `24px`) destroy the editorial aesthetic. Furthermore, cart action button with `rgba(0,0,0,0.2)` on black accent `#18181B` is completely unreadable.
4. **Step 4 (Resolution)**: By adding full semantic tokens (`--theme-card-shadow-hover`, `--theme-card-shadow-lg`, `--theme-radius-sm`, `--theme-radius-full`, `--theme-accent-glow`) to `THEMES` in `src/lib/themes.ts` and refactoring all 20 locations in `page.tsx` to bind strictly to CSS variables, we achieve 100% theme fidelity with zero hardcoded color leaks across all 5 themes.

---

## 3. Caveats

1. **Global CSS Root Override**: `page.tsx:608` contains `<style dangerouslySetInnerHTML={{ __html: `:root, body { ${themeCss} }` }} />`. While this styles the whole document for the customer menu view, client-side navigation back to `/` or `/owner` could retain mutated `:root` variables unless the target page resets them or if styles are scoped to `.cm-root-wrapper`. It is safer to apply scoped theme variables to `.cm-root-wrapper, .cm-container` as well.
2. **Icons in Table Hub**: The Lucide icon colors in the Table Service FAB (`Bell`, `Receipt`, `Droplets`, `CreditCard`) use amber, emerald, blue, and purple. In dark mode, these colors should have sufficient luminance contrast against `var(--theme-surface)` (`#181818`), which they do when set to standard vibrant hexes (`#F59E0B`, `#10B981`, `#3B82F6`, `#8B5CF6`).
3. **Owner Studio Require**: Modifying `src/app/owner/page.tsx:572` to use ES top-level import is straightforward and prevents runtime re-evaluations.

---

## 4. Conclusion

The customer menu component architecture is robust, responsive, and feature-complete, but suffers from 20 localized hardcoded color/radius/shadow leaks that compromise visual integrity in `OLED_CARBON` and `NEO_EDITORIAL`.

The proposed token matrix and refactoring plan detailed in `analysis.md` resolves every leakage, optimizes the dynamic SVG coffee radar chart, adds the QR table badge, and ensures full multi-theme fidelity.

---

## 5. Verification Method

1. **Static Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   Must succeed with 0 errors.

2. **Source Code Inspection**:
   - Inspect `src/lib/themes.ts`: Ensure all 5 themes define the complete token set including shadows, radiuses, and glow effects.
   - Inspect `src/app/c/[cafeSlug]/page.tsx`: Confirm 0 occurrences of `#FEF3C7`, `#FFF`, `#D1FAE5`, `#DBEAFE`, `#EF4444`, or hardcoded radiuses.
   - Inspect `src/app/owner/page.tsx:572`: Verify `require("@/lib/themes")` is replaced with top-level `import { THEMES } from "@/lib/themes";`.

3. **Theme Visual Verification**:
   - Verify `/c/noir-social-club` renders in pure `OLED_CARBON` dark mode with glowing amber stamps, amber radar polygon, and dark surface modals.
   - Verify `/c/roastery-collective` renders in `NORDIC_MINIMAL` warm linen style.
   - Verify `NEO_EDITORIAL` renders with sharp 0px corners, 4px block shadows, and high contrast.
   - Verify `WARM_TERRACOTTA` renders with soft rounded corners (22-30px) and warm clay tones.
   - Verify `ARTISAN_SEPIA` renders with warm parchment textures and bronze accents.
