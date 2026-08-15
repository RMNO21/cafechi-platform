# Scope: Milestone 1 — 5-Theme Design System & Customer Menu Theme Fidelity

## Architecture
- `src/lib/themes.ts`: Theme definitions, 13 CSS variables per theme, token getters, theme CSS string generator.
- `src/app/globals.css`: Global baseline, Vazirmatn Persian typography, smooth theme transitions, utility classes.
- `src/app/c/[cafeSlug]/page.tsx`: Customer menu page with dynamic theme injection via `.cm-root-wrapper` CSS variables and scoped styles.

## Feature Scope
1. **5 Themes Complete Fidelity**:
   - `NORDIC_MINIMAL`: Clean light Scandinavian style (alabaster `#FAFAFA`, white surface `#FFFFFF`, crisp zinc borders `#E4E4E7`, dark charcoal text `#18181B`, muted `#71717A`, crisp accent `#18181B`).
   - `OLED_CARBON`: Pure deep black `#09090B` / `#000000`, true dark surfaces `#121215` / `#18181B`, dark subtle borders `#27272A`, bright white text `#FAFAFA`, amber/gold or vivid accent `#F59E0B` / `#E2E8F0`.
   - `ARTISAN_SEPIA`: Warm parchment paper `#FDFBF7` / `#F5EFE6`, warm linen surfaces `#EFE9DF`, sepia bronze borders `#D8CEBC`, espresso roast text `#2C1810`, warm terracotta/amber accent `#C26D38` / `#96421B`.
   - `NEO_EDITORIAL`: High contrast editorial `#F4F4F0`, bold ivory surface `#FFFFFF`, stark black borders `#000000` (2px), bold black text `#000000`, vibrant electric accent `#E11D48` / `#2563EB`, sharp radius (0px - 2px), bold typography.
   - `WARM_TERRACOTTA`: Earthy terracotta background `#FAF5F0`, toasted cream surfaces `#F2EAE1`, clay borders `#DFD3C3`, rich roasted bean text `#382318`, terracotta clay accent `#C45A36`.
2. **Customer Menu Widgets & Zero Hardcoded Colors**:
   - "همان همیشگی" (Haman Hamishegi) hero banner & quick cards: full dynamic theme token bindings.
   - Loyalty stamp card: 6 slots, active stamps illuminated with `var(--theme-accent)`.
   - 5-axis dynamic SVG coffee flavor radar chart: calculates radar polygon with active theme colors.
   - Category scroll spy tabs: active pill with `var(--theme-accent)` and smooth scrolling.
   - Menu item cards: background `var(--theme-surface)`, border `var(--theme-border)`, hover elevations.
   - Item detail bottom drawer sheet: modifiers, quantity controls, dynamic price calculation.
   - Floating cart bar: bottom sheet cart preview, order count badge with theme contrast.
   - Table service hub & FAB: QR table badge, service calls (waiter, bill, water, POS), dismiss/active feedback.
   - Replace any hardcoded `#FEF3C7`, `#FFF`, `#D1FAE5`, `#EF4444` with proper theme CSS variables / dynamic RGBA tints.
   - Clean up `require()` in `src/app/owner/page.tsx:572` (`ThemePreview`).

## Milestones Decomposition
- **Step 1 (Explorer -> Worker -> Reviewer -> Challenger -> Auditor)**:
  - Worker modifies `src/lib/themes.ts`, `src/app/c/[cafeSlug]/page.tsx`, `src/app/globals.css`, and fixes `src/app/owner/page.tsx` import.
  - Reviewers (2) verify visual consistency, CSS variables, and zero color leakage.
  - Challengers (2) verify all 5 themes render correctly without errors or styling breakage.
  - Forensic Auditor verifies genuine implementation and no mock bypasses.
  - Gate status check.
