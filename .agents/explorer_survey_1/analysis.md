# CafeChi Theme System & Customer Menu Architecture Analysis

**Date**: 2026-08-16  
**Investigator**: Explorer 1  
**Target Subsystems**: Theme System (`src/lib/themes.ts`, `globals.css`, `types/index.ts`) & Customer Menu (`src/app/c/[cafeSlug]/page.tsx`, widgets, API routes)

---

## 1. Executive Summary

CafeChi features a bespoke, lightweight, zero-runtime-overhead CSS variable design system specifically tailored for specialty coffee shops and hospitality workflows in Persian (RTL). 
The platform supports **5 distinct visual themes** (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`), each defining dedicated background tones, surface elevations, borders, radiuses, shadows, and typography weights.

The customer menu interface at `/c/[cafeSlug]` is implemented as a high-performance Next.js App Router client component that dynamically binds the cafe's active theme, providing rich interactive widgets: "همان همیشگی" (Haman Hamishegi) favorite reorders, digital loyalty stamp cards, category tabs with bidirectional scroll spy, menu item cards with modifier customizations, coffee flavor radar charts, floating cart bar, table service FAB hub, and multi-mode checkout flows (`PAY_UPFRONT_BUZZER`, `PAY_AT_COUNTER`, `TABLE_TAB_SPLIT`, `VIEW_ONLY`).

---

## 2. Comprehensive 5-Theme Design System Mapping

All 5 themes are defined in `src/lib/themes.ts` (lines 3–144) and typed in `src/types/index.ts` (lines 37–43, 314–327).

### 2.1 Theme Specification Matrix

| Theme Identifier | Name (FA / EN) | Aesthetic Archetype & Mood | Background (`--theme-bg`) | Secondary BG (`--theme-bg-2`) | Surface (`--theme-surface`) | Border (`--theme-border`) | Text (`--theme-text` / `2`) | Accent (`--theme-accent` / `2`) | Accent FG (`--theme-accent-fg`) | Radius (`base` / `lg`) | Elevation / Card Shadow (`--theme-card-shadow`) | Display Weight (`--theme-font-weight-display`) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `NORDIC_MINIMAL` | نوردیک مینیمال<br>*Nordic Minimal* | Sandstone, warm linen, roasted hazelnut & obsidian typography. Modern specialty roasteries. | `#F6F3EE` | `#ECE7DE` | `#FAF8F5` | `#DED7CA` | `#1C1917`<br>`#78716C` | `#8B5E3C`<br>`#A2734E` | `#FFFFFF` | `12px`<br>`20px` | `0 2px 10px rgba(44,30,20,0.06)` | `800` |
| `OLED_CARBON` | اولد کربن<br>*OLED Carbon* | Deep OLED black, carbon fiber surfaces, luminous amber gold. Night coffee bars & moody lounges. | `#080808` | `#121212` | `#181818` | `#282828` | `#F5F5F4`<br>`#A8A29E` | `#F59E0B`<br>`#D97706` | `#080808` | `10px`<br>`18px` | `0 4px 20px rgba(0,0,0,0.8)` | `900` |
| `ARTISAN_SEPIA` | آرتیزان سپیا<br>*Artisan Sepia* | Handmade parchment cream, fine borders, roasted brown notes. Heritage cafes, micro-roasters & estates. | `#F8F3E8` | `#EFE6D5` | `#FFFDF9` | `#DFCDB8` | `#2B1D14`<br>`#745846` | `#8D4A23`<br>`#A85B2D` | `#FFFDF9` | `8px`<br>`16px` | `0 2px 8px rgba(43,29,20,0.08)` | `800` |
| `NEO_EDITORIAL` | نئو ادیتوریال<br>*Neo Editorial* | Sharp grid frame, brutalist block shadows, crisp monochrome typography. Minimalist art & journal cafes. | `#F4F4F0` | `#E8E8E2` | `#FFFFFF` | `#18181B` | `#09090B`<br>`#52525B` | `#18181B`<br>`#3F3F46` | `#FFFFFF` | `0px`<br>`0px` | `4px 4px 0px #18181B` | `900` |
| `WARM_TERRACOTTA` | ترراکوتای گرم<br>*Warm Terracotta* | Warm clay and baked terracotta tones, ultra-soft curved radii. Bakeries, pastry boutiques & brunch spots. | `#FCF3EC` | `#F7E4D8` | `#FFFFFF` | `#F3D2C0` | `#3C1B10`<br>`#8C513D` | `#C25327`<br>`#D96B40` | `#FCF3EC` | `22px`<br>`30px` | `0 4px 16px rgba(194,83,39,0.12)` | `800` |

### 2.2 Global Typography & CSS Variable Architecture

Located in `src/app/globals.css` (lines 1–82):
- **Persian Font Family**: `Vazirmatn` (Weights 100–900) via Google Fonts (`--font-persian: 'Vazirmatn', 'Segoe UI', sans-serif`).
- **Latin / Numeric Font Family**: `Plus Jakarta Sans` (Weights 400–800) via Google Fonts (`--font-latin: 'Plus Jakarta Sans', 'Inter', sans-serif`) — applied to `.price`, `.number`, `.badge-number` with `direction: ltr` for clean tabular numbers.
- **Monospace Font Family**: `Geist Mono` (`--font-mono: 'Geist Mono', 'Courier New', monospace`) — applied to `.code`, `.mono`, and order verification tokens.
- **Global Spacing System**: `--space-1` (0.25rem) to `--space-24` (6rem).
- **Global Radii Scale**: `--radius-sm` (4px) to `--radius-full` (9999px).
- **Global Elevation Shadows**: `--shadow-xs` through `--shadow-xl`.

---

## 3. Customer Menu Architecture (`/c/[cafeSlug]`)

Located in `src/app/c/[cafeSlug]/page.tsx` (1,412 lines).

### 3.1 Data Flow & Hydration Lifecycle
1. **Initial Fallback Resolution**: Checks `FALLBACK_CAFES` dictionary for zero-latency initial render during SSR / client hydration.
2. **Dynamic Background SWR Fetch**: Fires parallel `fetch('/api/menu/[cafeSlug]')` and `fetch('/api/the-usual/[cafeSlug]')` inside `useEffect`.
3. **Theme Extraction**:
   ```ts
   const activeTheme = getTheme(cafe.themeId || cafe.theme || 'NORDIC_MINIMAL');
   const themeCss = getThemeCssString(cafe.themeId || cafe.theme || 'NORDIC_MINIMAL');
   ```
4. **Theme Injection Mechanism**:
   - Top-level container `.cm-root-wrapper` injects `activeTheme.cssVars` as inline React CSS styles.
   - Dynamically injected `<style>` tag injects `:root, body { ${themeCss} }` to cascade into subcomponents and modals.
   - Encapsulated Scoped Stylesheet (`.cm-container`, `.cm-header`, `.cm-item-card`, etc.) binds to `--theme-*` variables directly.

### 3.2 Category Navigation & Scroll Spy
- Category tabs are rendered in a horizontal scrollable pill bar (`.cm-tabs-scroll`).
- Bidirectional synchronization via `IntersectionObserver` observing all category section DOM nodes (`rootMargin: '-100px 0px -60% 0px'`).
- Clicking a tab smoothly scrolls the window to `offsetTop - 80px` and sets the active category pill.

---

## 4. Deep-Dive: Specific Customer Menu Widgets

### 4.1 "همان همیشگی" (Haman Hamishegi) Favorite Reorder Widget
- **File & Lines**: `src/app/c/[cafeSlug]/page.tsx:1098–1122`
- **Styling**:
  - Container `.cm-usual-hero`: Uses gradient `linear-gradient(135deg, var(--theme-accent), var(--theme-accent-2))` with dynamic `--theme-radius-lg`.
  - Cards `.cm-usual-card`: Glassmorphism effect with `background: rgba(255, 255, 255, 0.15)`, `backdrop-filter: blur(10px)`, and `border: 1px solid rgba(255, 255, 255, 0.25)`.
  - Action button `.cm-usual-btn`: Inverted contrast surface `background: var(--theme-surface)` with `color: var(--theme-accent)`.
- **Functionality**: Loads customer's top ordered items or cafe popular staples from `/api/the-usual/[cafeSlug]` and allows 1-click instant cart addition.

### 4.2 Digital Loyalty Stamps Widget
- **File & Lines**: `src/app/c/[cafeSlug]/page.tsx:1124–1144`
- **Styling**:
  - Container `.cm-loyalty-card`: `background: var(--theme-surface)`, `border: 1px solid var(--theme-border)`, `box-shadow: var(--theme-card-shadow)`.
  - Badge `.cm-loyalty-badge`: `background: var(--theme-accent)`, `color: var(--theme-accent-fg)`, pill rounded.
  - Stamp Circles `.cm-stamp-item`: Dashed 2px border `border: 2px dashed var(--theme-border)` when inactive; solid active fill `background: var(--theme-accent)`, `color: var(--theme-accent-fg)`, `box-shadow: var(--theme-card-shadow)` when earned.
- **Functionality**: Displays current stamps out of 6 (e.g. 3 of 6) towards free drinks.

### 4.3 Category Sections & Menu Item Cards
- **File & Lines**: `src/app/c/[cafeSlug]/page.tsx:1146–1216`
- **Styling**:
  - Section Title `.cm-cat-title`: Accent border-right indicator `border-right: 4px solid var(--theme-accent)` with `var(--theme-font-weight-display)`.
  - Card `.cm-item-card`: Flex row with `background: var(--theme-surface)`, `border: 1px solid var(--theme-border)`, `border-radius: var(--theme-radius-lg)`, and hover elevation `translateY(-2px)`.
  - Thumbnail `.cm-item-thumb`: `background: var(--theme-bg-2)`, `border-radius: var(--theme-radius)`.
  - Plus Button `.cm-item-plus-btn`: `background: var(--theme-accent)`, `color: var(--theme-accent-fg)`.
  - Out-of-Stock: 0.5 opacity dimming with "ناموجود" overlay badge.

### 4.4 Specialty Coffee Flavor Profile Radar Chart
- **File & Lines**: `src/app/c/[cafeSlug]/page.tsx:14–71, 1286–1293`
- **Styling**:
  - Custom SVG Radar component measuring 5 sensory dimensions: Acidity (اسیدیته), Body (بادی), Sweetness (شیرینی), Bitterness (تلخی), Aroma (عطر).
  - Concentric polygon grid lines and axes use `var(--theme-text)` with `strokeOpacity="0.1"`.
  - Data polygon uses `fill="var(--theme-accent)"` at 0.3 opacity, `stroke="var(--theme-accent)"` stroke width 2, and circular vertex nodes `fill="var(--theme-accent)"`.

### 4.5 Item Customization Drawer / Bottom Sheet
- **File & Lines**: `src/app/c/[cafeSlug]/page.tsx:1268–1365`
- **Styling**:
  - Backdrop `.cm-drawer-overlay`: `rgba(0,0,0,0.6)` with `backdrop-filter: blur(4px)`.
  - Bottom Sheet `.cm-drawer-sheet`: `background: var(--theme-surface)`, top border radii `24px`.
  - Modifiers: Radio (single choice) and Checkbox (multi choice) options with `accentColor: var(--theme-accent)` and active border `var(--theme-accent)`.
  - Quantity counter in `var(--theme-surface)` with `var(--theme-border)` and `Minus`/`Plus` buttons in `var(--theme-accent)`.
  - Bottom sticky CTA button: `background: var(--theme-accent)`, `color: var(--theme-accent-fg)`.

### 4.6 Floating Sticky Cart Bar
- **File & Lines**: `src/app/c/[cafeSlug]/page.tsx:1220–1238`
- **Styling**:
  - Floating container `.cm-cart-bar`: Fixed at bottom `bottom: 16px`, `background: var(--theme-accent)`, `color: var(--theme-accent-fg)`, `box-shadow: 0 8px 30px rgba(0,0,0,0.25)`.
  - Cart item counter badge: Displays item count in circle badge.
  - Subtotal calculation & checkout trigger.

### 4.7 Table Service Hub (Table QR / Staff Call)
- **File & Lines**: `src/app/c/[cafeSlug]/page.tsx:1240–1265`
- **Styling**:
  - Fixed FAB Button `.cm-table-fab`: `position: fixed; bottom: 84px; right: 20px; background: var(--theme-surface); color: var(--theme-text); border: 1px solid var(--theme-border); box-shadow: 0 4px 16px rgba(0,0,0,0.15)`.
  - Popover Menu `.cm-table-hub-menu`: `background: var(--theme-surface); border: 1px solid var(--theme-border); border-radius: 16px`.
  - 4 Direct Actions:
    1. Call Waiter (`صدا زدن سالن‌کار`) -> `CALL_WAITER`
    2. Request Bill (`درخواست صورتحساب`) -> `REQUEST_BILL`
    3. Request Cold Water (`درخواست آب خنک`) -> `REQUEST_WATER`
    4. Request POS Terminal (`درخواست کارتخوان`) -> `REQUEST_POS`
  - Submits POST to `/api/table-service`.

---

## 5. Theme Leakages, Inconsistencies & Hardcoded Color Audit

During our forensic audit of `src/app/c/[cafeSlug]/page.tsx` and related pages, we identified the following visual and architectural leakages:

| # | Location / Lines | Current Implementation | Issue Description | Proposed Resolution |
|---|---|---|---|---|
| 1 | `src/app/c/[cafeSlug]/page.tsx:712–718` | `.cm-banner-viewonly { background: #FEF3C7; color: #92400E; border-bottom: 1px solid #FDE68A; }` | In `OLED_CARBON` dark mode, hardcoded light yellow amber banner is glaring and breaks dark aesthetic. | Use theme-aware warning token or theme background with warning accent border. |
| 2 | `src/app/c/[cafeSlug]/page.tsx:1225` | `background: '#FFF', color: 'var(--theme-accent)'` on cart badge | Hardcoded `#FFF` badge background does not respect theme surface / inverted contrast across dark themes. | Use `background: var(--theme-surface)` or `var(--theme-accent-fg)` and `color: var(--theme-accent)`. |
| 3 | `src/app/c/[cafeSlug]/page.tsx:1261` | `background: tableHubOpen ? '#EF4444' : 'var(--theme-surface)'` | Hardcoded `#EF4444` and `#FFF` when FAB is active. | Use `var(--color-red)` or themed accent close button style. |
| 4 | `src/app/c/[cafeSlug]/page.tsx:1373, 1389` | `background: '#D1FAE5', color: '#059669'` and `background: '#DBEAFE', color: '#2563EB'` | Checkout modal icon badges have light pastel backgrounds that clash in dark themes (`OLED_CARBON`). | Use semi-transparent emerald/blue backgrounds (e.g. `rgba(5, 150, 105, 0.15)` and `rgba(37, 99, 235, 0.15)`). |
| 5 | `src/app/c/[cafeSlug]/page.tsx:1172` | `background: 'rgba(0,0,0,0.6)', color: '#fff'` on out-of-stock overlay | Out of stock badge uses fixed black overlay rather than theme surface dimming. | Use `background: rgba(0, 0, 0, 0.7)` with `var(--theme-text)` or semi-transparent surface. |
| 6 | `src/app/owner/page.tsx:572` | `const { THEMES } = require("@/lib/themes");` inside `ThemePreview` | Uses dynamic CommonJS `require()` inside a React client component instead of top-level ES module import. | Add `THEMES` to the top-level import from `@/lib/themes`. |
| 7 | `src/app/globals.css:69–82` | `:root` fallback variables missing `--theme-bg-2`, `--theme-text-2`, `--theme-accent-2` | Fallbacks in `:root` have incomplete coverage if a page renders without an active cafe theme wrapper. | Add complete fallback definitions for all 13 `--theme-*` variables in `:root`. |

---

## 6. Verification Status

- **TypeScript Compilation**: `npx tsc --noEmit` runs with **0 errors**.
- **Database Schema**: Prisma schema confirms `Cafe.themeId` column with default `"NORDIC_MINIMAL"`.
- **Validation**: `src/lib/validations.ts` enforces `z.enum(["NORDIC_MINIMAL", "OLED_CARBON", "ARTISAN_SEPIA", "NEO_EDITORIAL", "WARM_TERRACOTTA"])`.
- **Git Remotes**: Configured with dual upstream remotes (`origin`: `RMNO21/cafechi-platform`, `netlify-repo`: `RMNO21/cafechi-platform-24d8b`).
