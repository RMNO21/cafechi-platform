# Code Changes Report — Milestone 1

**Worker**: `worker_m1_1`  
**Date**: 2026-08-16  
**Scope**: 5-Theme Design System & Customer Menu Theme Fidelity

---

## 1. `src/lib/themes.ts`
- **Line 26–30, 56–60, 86–90, 116–120, 146–150**: Added supporting design system tokens (`--theme-card-shadow-hover`, `--theme-card-shadow-lg`, `--theme-radius-sm`, `--theme-radius-full`, `--theme-accent-glow`) across all 5 themes (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`).
- **Line 160–166**: Updated `getThemeCssString` with optional/string parameter and fallback: `THEMES[themeId as ThemeId] ?? THEMES.NORDIC_MINIMAL`.
- **Line 168–170**: Updated `getTheme` to fallback gracefully to `THEMES.NORDIC_MINIMAL`.

## 2. `src/app/globals.css`
- **Line 79–84**: Added fallback CSS variables to `:root` for extended theme properties (`--theme-card-shadow-hover`, `--theme-card-shadow-lg`, `--theme-radius-sm`, `--theme-radius-full`, `--theme-accent-glow`).

## 3. `src/app/owner/page.tsx`
- **Line 10**: Replaced unused imports with top-level `import { THEMES, THEME_LIST } from "@/lib/themes";`.
- **Line 571–640**: Replaced dynamic CommonJS `require("@/lib/themes")` inside `ThemePreview` with top-level `THEMES[themeId] ?? THEMES.NORDIC_MINIMAL`, removed unused `vars` dictionary, and typed preview container with `fontFamily: "var(--font-persian)"`.

## 4. `src/app/c/[cafeSlug]/page.tsx`
- **Line 1–10**: Cleaned up unused imports (`useMemo`, `ChevronUp`, `AlertTriangle`, `Info`), added `useRouter`.
- **Line 14–80**: Expanded `CoffeeRadar` SVG dimensions from 160x160 to 200x200 (`radius = 64`, `labelRadius = 82`), wrapped in LTR container with `fontFamily: "var(--font-persian)"`, `fontWeight: 700`, `fontSize: 11`, `stroke: "var(--theme-border)"`, dynamic polygon `fill: "var(--theme-accent)"` at 0.25 opacity with 0 text clipping.
- **Line 82 & 348**: Replaced untyped `FALLBACK_CAFES: Record<string, any>` with `Record<string, CafePublic>`.
- **Line 380–395**: Optimized params subscription and fallback initialization effect.
- **Line 460–470**: Updated `scrollToCategory` scroll offset to `-120` to ensure sticky category tabs never cover section headings.
- **Line 472–495**: Refactored `addToCart` to `useCallback` with pure deterministic ID generator (`${item.id}-${modifierKey}-${prev.length + 1}`) to eliminate `react-hooks/purity` violations, and removed dead `removeFromCart` helper.
- **Line 520, 549, 588**: Replaced all `any` casts with explicit typed interfaces (`CafePublic & { tables?: ... }`, `SelectedModifier`).
- **Line 572**: Replaced `window.location.href` assignment with `router.push()`.
- **Line 608**: Changed global style injection from `:root, body { ${themeCss} }` to `.cm-root-wrapper { ${themeCss} }` to isolate theme styling from polluting other routes.
- **Line 628–632**: Container shadow bound to `var(--theme-card-shadow-lg)`.
- **Line 703–718**: Category tab buttons bound to `var(--theme-radius-full)`.
- **Line 720–730**: View-only banner migrated from `#FEF3C7`/`#92400E` to `var(--theme-bg-2)`, `var(--theme-text)`, and `var(--theme-border)`.
- **Line 752–787**: "همان همیشگی" (Haman Hamishegi) hero card and button styles converted to dynamic theme tokens (`color-mix(in srgb, var(--theme-accent-fg) 16%, transparent)` and `var(--theme-card-shadow)`).
- **Line 811–837**: Loyalty stamp card and stamp slots bound to `var(--theme-radius-full)`, `var(--theme-bg-2)`, active stamps illuminated with `var(--theme-accent)` and `box-shadow: 0 0 12px var(--theme-accent-glow)`.
- **Line 859–865**: Menu item card hover shadow bound to `var(--theme-card-shadow-hover)`.
- **Line 925**: Plus button radius bound to `var(--theme-radius)`.
- **Line 949–955**: Floating cart bar container bound to `var(--theme-radius-lg)` and `var(--theme-card-shadow-lg)`.
- **Line 957–988**: Table FAB and popup menu bound to `var(--theme-radius-full)`, `var(--theme-radius-lg)`, and `var(--theme-card-shadow-lg)`.
- **Line 1172**: Out of stock badge bound to `rgba(0,0,0,0.7)` with `backdrop-filter: blur(2px)` and `border-radius: var(--theme-radius)`.
- **Line 1225**: Cart count badge bound to `var(--theme-surface)` and `var(--theme-accent)` for universal high-contrast legibility across dark and light themes.
- **Line 1234**: Checkout pill background bound to `color-mix(in srgb, var(--theme-accent-fg) 20%, transparent)` and `var(--theme-radius)`.
- **Line 1245–1254**: Table service hub icons mapped to semantic theme tokens (`var(--color-amber)`, `var(--color-emerald)`, `var(--color-accent)`, `var(--theme-accent)`).
- **Line 1261**: Table FAB open state mapped to `var(--color-red, #EF4444)` and `var(--theme-surface)`.
- **Line 1280–1360**: Drawer sheet, modifier groups, and steppers bound to `var(--theme-radius)`, `var(--theme-radius-lg)`, `var(--theme-radius-sm)`, and `var(--theme-card-shadow)`.
- **Line 1373–1405**: Checkout modal containers, icon badges, and action buttons bound to theme tokens and alpha tints.
