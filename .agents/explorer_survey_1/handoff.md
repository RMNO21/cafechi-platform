# Handoff Report — Explorer 1: Theme System & Customer Menu Survey

**Target File**: `c:\Users\User\Documents\cafechi\.agents\explorer_survey_1\handoff.md`  
**Working Directory**: `c:\Users\User\Documents\cafechi\.agents\explorer_survey_1`  
**Investigator**: Explorer 1  
**Timestamp**: 2026-08-16T00:43:30+03:30  

---

## 1. Observation

Direct observations from codebase inspection:

1. **Theme System Definition & Storage**:
   - `src/lib/themes.ts:3–144`: Exports `THEMES: Record<ThemeId, ThemeDefinition>` defining all 5 themes: `NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`.
   - `src/types/index.ts:37–43`: Defines type `ThemeId = "NORDIC_MINIMAL" | "OLED_CARBON" | "ARTISAN_SEPIA" | "NEO_EDITORIAL" | "WARM_TERRACOTTA"`.
   - `prisma/schema.prisma:51`: Cafe model defines `themeId String @default("NORDIC_MINIMAL")`.
   - `src/lib/validations.ts:30–38`: Zod validation enforces `themeId: z.enum(["NORDIC_MINIMAL", "OLED_CARBON", "ARTISAN_SEPIA", "NEO_EDITORIAL", "WARM_TERRACOTTA"]).optional()`.

2. **Global Styling & Typography**:
   - `src/app/globals.css:1`: Imports `@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;200;300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap')`.
   - `src/app/globals.css:44–46`: Sets `--font-persian: 'Vazirmatn'`, `--font-latin: 'Plus Jakarta Sans'`, `--font-mono: 'Geist Mono'`.
   - No Tailwind CSS configuration or dependency exists in `package.json`; pure modern CSS variables and scoped styles are used.

3. **Customer Menu Architecture (`/c/[cafeSlug]`)**:
   - `src/app/c/[cafeSlug]/page.tsx:594–608`: Theme injection retrieves theme definition via `getTheme(cafe.themeId)` and `getThemeCssString(...)`, applying CSS variables to `.cm-root-wrapper` and injecting a scoped `<style>` block.
   - `src/app/c/[cafeSlug]/page.tsx:1098–1122`: "همان همیشگی" widget renders gradient hero `.cm-usual-hero` with glassmorphic cards `.cm-usual-card` and quick-add buttons `.cm-usual-btn`.
   - `src/app/c/[cafeSlug]/page.tsx:1124–1144`: Loyalty stamp card `.cm-loyalty-card` displays 6 stamp slots `.cm-stamp-item`, lighting up active stamps with `var(--theme-accent)`.
   - `src/app/c/[cafeSlug]/page.tsx:1083–1094`: Category horizontal scroll tabs `.cm-tabs-scroll` synchronized with category sections via `IntersectionObserver` scroll spy.
   - `src/app/c/[cafeSlug]/page.tsx:1158–1215`: Menu item cards `.cm-item-card` with thumbnail, description, price, tags, and plus button.
   - `src/app/c/[cafeSlug]/page.tsx:14–71, 1286–1293`: `CoffeeRadar` dynamic SVG component calculates and draws 5-axis flavor radar charts using theme accent and text colors.
   - `src/app/c/[cafeSlug]/page.tsx:1268–1365`: Bottom drawer sheet `.cm-drawer-sheet` supports item modifiers (radio/checkboxes), quantity adjustments, and total price calculation.
   - `src/app/c/[cafeSlug]/page.tsx:1220–1238`: Floating cart bar `.cm-cart-bar` positioned at `bottom: 16px`.
   - `src/app/c/[cafeSlug]/page.tsx:1240–1265`: Table service FAB `.cm-table-fab` opens `.cm-table-hub-menu` with waiter call, bill request, water request, and POS request.

4. **Hardcoded Colors & Minor Inconsistencies**:
   - `src/app/c/[cafeSlug]/page.tsx:712–718`: `.cm-banner-viewonly` uses fixed `#FEF3C7` / `#92400E` (bright yellow in dark mode).
   - `src/app/c/[cafeSlug]/page.tsx:1225`: Cart count badge uses fixed `background: '#FFF'`.
   - `src/app/c/[cafeSlug]/page.tsx:1261`: Table FAB active state uses `#EF4444` / `#FFF`.
   - `src/app/c/[cafeSlug]/page.tsx:1373, 1389`: Checkout modals use light pastel `#D1FAE5` / `#DBEAFE` backgrounds inside modal card.
   - `src/app/owner/page.tsx:572`: `ThemePreview` uses `const { THEMES } = require("@/lib/themes");` inside component body instead of top-level import.

5. **Build Verification**:
   - `npx tsc --noEmit` exited with code 0 (clean TypeScript build).

---

## 2. Logic Chain

1. **Premise 1**: The CafeChi design system is designed around 5 specific theme IDs (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`) to cater to diverse cafe atmospheres (specialty roasteries, dark moody bars, heritage artisan roasters, editorial brutalist spaces, and warm terracotta bakeries).
2. **Premise 2**: In `src/lib/themes.ts`, every theme defines a comprehensive set of 13 CSS variables spanning background layers, surfaces, borders, text contrasts, accent colors, radius curves, elevation shadows, and display font weights.
3. **Premise 3**: The customer menu component (`src/app/c/[cafeSlug]/page.tsx`) consumes these CSS variables directly in its scoped CSS classes, ensuring that switching `cafe.themeId` immediately re-skins the entire customer UI (headers, tabs, cards, widgets, radars, drawers, and buttons).
4. **Premise 4**: A few specific UI elements (e.g. view-only banner, cart count badge, modal checkmark backgrounds, FAB active color) contain hardcoded hex values (`#FEF3C7`, `#FFF`, `#D1FAE5`, `#EF4444`) that cause slight visual dissonance when rendered under dark themes like `OLED_CARBON`.
5. **Conclusion**: The theme engine is robust, properly typed, and structurally sound. Removing the isolated hardcoded colors and replacing them with theme variable bindings / translucent RGBA tints will achieve 100% theme fidelity across all 5 themes.

---

## 3. Caveats

- **Network / External Fonts**: Google Fonts (`Vazirmatn`, `Plus Jakarta Sans`, `Geist Mono`) require internet connectivity; in offline environments, fallback fonts (`'Segoe UI'`, `'Inter'`, `'Courier New'`) take over.
- **Client-Side Theme Switching**: In the customer menu, the theme is bound to the cafe entity rather than a client-side user toggle (by design, each cafe dictates its visual branding).

---

## 4. Conclusion

The CafeChi theme system and customer menu interface are fully mapped and detailed in `c:\Users\User\Documents\cafechi\.agents\explorer_survey_1\analysis.md`. The design system is modular, clean, and ready for systematic refinement and multi-page alignment.

---

## 5. Verification Method

To independently verify these findings:

1. Run TypeScript check:
   ```bash
   npx tsc --noEmit
   ```
2. Verify all 5 theme definitions:
   Inspect `src/lib/themes.ts` lines 3–144.
3. Verify customer menu theme binding and widgets:
   Inspect `src/app/c/[cafeSlug]/page.tsx` lines 594–608, 1098–1144, 1158–1265.
4. Verify dual git remotes:
   ```bash
   git remote -v
   ```
