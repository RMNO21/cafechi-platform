## 2026-08-16T00:50:38Z
You are the Worker for Milestone 1: 5-Theme Design System & Customer Menu Theme Fidelity.
Your working directory is: c:\Users\User\Documents\cafechi\.agents\worker_m1_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mandatory reading:
- c:\Users\User\Documents\cafechi\.agents\ORIGINAL_REQUEST.md
- c:\Users\User\Documents\cafechi\PROJECT.md
- c:\Users\User\Documents\cafechi\.agents\sub_orch_m1\SCOPE.md
- c:\Users\User\Documents\cafechi\.agents\explorer_m1_1\analysis.md
- c:\Users\User\Documents\cafechi\.agents\explorer_m1_2\analysis.md
- c:\Users\User\Documents\cafechi\.agents\explorer_m1_3\analysis.md

Exclusive File Ownership:
- `src/lib/themes.ts`
- `src/app/globals.css`
- `src/app/c/[cafeSlug]/page.tsx`
- `src/app/owner/page.tsx`

Tasks:
1. In `src/lib/themes.ts`:
   - Verify all 5 themes (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`) with 13 CSS variables per theme.
   - Update `getThemeCssString` to properly fallback: `THEMES[themeId as ThemeId] ?? THEMES.NORDIC_MINIMAL`.
   - Maintain complete type safety.
2. In `src/app/c/[cafeSlug]/page.tsx`:
   - Eliminate all 20 hardcoded color, radius, and shadow leaks across all customer menu components (view-only banner, "همان همیشگی" quick cards, item cards & hover elevation, out of stock badge, floating cart badge/button, table service hub icons & FAB open states, loyalty stamp card, coffee radar chart, checkout confirmation modals).
   - Ensure dynamic SVG coffee radar chart dimensions, polygons, and labels render perfectly with active theme colors and 0 clipping.
   - Ensure loyalty stamps illuminate with active `var(--theme-accent)`.
   - Ensure dynamic theme styling is injected cleanly via `.cm-root-wrapper` and scoped `<style>` tag without mutating other application routes.
3. In `src/app/owner/page.tsx`:
   - Replace `const { THEMES } = require("@/lib/themes");` inside `ThemePreview` with top-level `import { THEMES, THEME_LIST } from "@/lib/themes";`.
   - Clean up any unused imports or lint issues.
4. In `src/app/globals.css`:
   - Ensure clean typography, smooth theme transitions, utility classes, and base resets.
5. Verification:
   - Run `npx tsc --noEmit` (must pass with 0 errors).
   - Run `npm run build` (must succeed).
6. Documentation & Completion:
   - Write `c:\Users\User\Documents\cafechi\.agents\worker_m1_1\changes.md` detailing every modified file and line.
   - Write `c:\Users\User\Documents\cafechi\.agents\worker_m1_1\handoff.md` with full Observation, Logic Chain, Caveats, Conclusion, and Verification results.
   - Send a completion message back to your caller.
