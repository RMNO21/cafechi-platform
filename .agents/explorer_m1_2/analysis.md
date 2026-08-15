# Comprehensive Analysis Report: Milestone 1 — 5-Theme Design System & Customer Menu Theme Fidelity

**Author**: Explorer 2 (Milestone 1)  
**Date**: 2026-08-16  
**Target Files**: `src/app/c/[cafeSlug]/page.tsx`, `src/app/globals.css`, `src/lib/themes.ts`, `src/app/owner/page.tsx`  
**Working Directory**: `c:\Users\User\Documents\cafechi\.agents\explorer_m1_2`

---

## 1. Executive Summary

A comprehensive investigation was conducted on the CafeChi Customer Menu (`/c/[cafeSlug]`), global stylesheets (`src/app/globals.css`), theme definitions (`src/lib/themes.ts`), and related theme preview components (`src/app/owner/page.tsx`).

The analysis revealed **20 distinct hardcoded color, radius, and shadow leaks** in `src/app/c/[cafeSlug]/page.tsx`, along with **hardcoded badge and SLA color classes** in `src/app/globals.css`, and a **require() statement lint violation** in `src/app/owner/page.tsx:572`.

Most critically, hardcoded colors such as `#FEF3C7` (view-only warning banner), `#FFF` (cart count badge), `#D1FAE5` (pay-at-counter success icon), `#DBEAFE` (table-tab split info icon), `#EF4444` (table FAB active state), and hardcoded `rgba(0,0,0,0.1)` hover shadows cause severe visual degradation in **`OLED_CARBON`** (blinding pastel/light backgrounds on dark mode) and **`NEO_EDITORIAL`** (blurry box-shadows overriding brutalist block shadows and non-zero radius breaking hard edges).

This report details every widget, itemizes each leakage with exact line numbers, and defines a robust 0-leak tokenization architecture to ensure 100% theme fidelity across all 5 themes.

---

## 2. 5-Theme Design System Specification & Token Matrix

| Variable Token | `NORDIC_MINIMAL` | `OLED_CARBON` | `ARTISAN_SEPIA` | `NEO_EDITORIAL` | `WARM_TERRACOTTA` |
|---|---|---|---|---|---|
| `--theme-bg` | `#F6F3EE` | `#080808` | `#F8F3E8` | `#F4F4F0` | `#FCF3EC` |
| `--theme-bg-2` | `#ECE7DE` | `#141414` | `#EFE6D5` | `#E8E8E2` | `#F7E4D8` |
| `--theme-surface` | `#FAF8F5` | `#181818` | `#FFFDF9` | `#FFFFFF` | `#FFFFFF` |
| `--theme-border` | `#DED7CA` | `#2A2A2A` | `#DFCDB8` | `#18181B` (2px) | `#F3D2C0` |
| `--theme-text` | `#1C1917` | `#F5F5F4` | `#2B1D14` | `#09090B` | `#3C1B10` |
| `--theme-text-2` | `#78716C` | `#A8A29E` | `#745846` | `#52525B` | `#8C513D` |
| `--theme-accent` | `#8B5E3C` | `#F59E0B` | `#8D4A23` | `#18181B` | `#C25327` |
| `--theme-accent-fg` | `#FFFFFF` | `#080808` | `#FFFDF9` | `#FFFFFF` | `#FCF3EC` |
| `--theme-accent-2` | `#A2734E` | `#D97706` | `#A85B2D` | `#3F3F46` | `#D96B40` |
| `--theme-card-shadow` | `0 2px 10px rgba(44,30,20,0.06)` | `0 4px 20px rgba(0,0,0,0.8)` | `0 2px 8px rgba(43,29,20,0.08)` | `4px 4px 0px #18181B` | `0 4px 16px rgba(194,83,39,0.12)` |
| `--theme-card-shadow-hover` | `0 6px 20px rgba(44,30,20,0.12)` | `0 6px 24px rgba(0,0,0,0.95)` | `0 6px 18px rgba(43,29,20,0.14)` | `6px 6px 0px #18181B` | `0 8px 24px rgba(194,83,39,0.20)` |
| `--theme-card-shadow-lg` | `0 12px 32px rgba(44,30,20,0.16)` | `0 16px 40px rgba(0,0,0,0.98)` | `0 12px 30px rgba(43,29,20,0.18)` | `8px 8px 0px #18181B` | `0 16px 36px rgba(194,83,39,0.24)` |
| `--theme-radius-sm` | `6px` | `6px` | `4px` | `0px` | `12px` |
| `--theme-radius` | `12px` | `10px` | `8px` | `0px` | `22px` |
| `--theme-radius-lg` | `20px` | `18px` | `16px` | `0px` | `30px` |
| `--theme-radius-full` | `9999px` | `9999px` | `9999px` | `0px` | `9999px` |
| `--theme-font-weight-display` | `800` | `900` | `800` | `900` | `800` |
| `--theme-accent-glow` | `rgba(139, 94, 60, 0.25)` | `rgba(245, 158, 11, 0.45)` | `rgba(141, 74, 35, 0.3)` | `none` | `rgba(194, 83, 39, 0.35)` |

---

## 3. Customer Menu Widget Inspection & Defect Breakdown

### 1. "همان همیشگی" (Haman Hamishegi) Hero Banner & Quick Cards
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:723-787` & `1098-1122`.
- **Defects Identified**:
  - `background: rgba(255, 255, 255, 0.15)` and `border: 1px solid rgba(255, 255, 255, 0.25)` on `.cm-usual-card` hardcode white alpha channels.
  - In `OLED_CARBON`, `--theme-accent` is amber `#F59E0B` and `--theme-accent-fg` is `#080808`. White alpha blends into washed-out yellowish white.
  - In `.cm-usual-btn`, `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` breaks `NEO_EDITORIAL` brutalist shadow.
- **Required Fix**:
  - Replace `.cm-usual-card` background with `color-mix(in srgb, var(--theme-accent-fg) 16%, transparent)` and border with `color-mix(in srgb, var(--theme-accent-fg) 25%, transparent)`.
  - Use `border-radius: var(--theme-radius, 12px)`.
  - In `.cm-usual-btn`, bind shadow to `var(--theme-card-shadow)`.

### 2. Loyalty Stamp Card (6 Slots)
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:788-837` & `1124-1144`.
- **Defects Identified**:
  - Active stamps (`.cm-stamp-item.active`) lack theme-specific accent illumination/glow.
  - Inactive stamps have transparent background which disappears on certain low-contrast surfaces.
- **Required Fix**:
  - Inactive stamps: `background: var(--theme-bg-2); border: 2px dashed var(--theme-border); color: var(--theme-text-2);`.
  - Active stamps: `background: var(--theme-accent); color: var(--theme-accent-fg); border-style: solid; border-color: var(--theme-accent); box-shadow: 0 0 12px var(--theme-accent-glow);`.
  - Stamp slot shape: `border-radius: var(--theme-radius-full, 50%);` so that in `NEO_EDITORIAL`, stamps can be sharp square tokens (0px radius) if desired or consistent geometric units.

### 3. 5-Axis Dynamic SVG Coffee Flavor Radar Chart
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:14-71` & `1286-1294`.
- **Defects Identified**:
  - Radar chart container size is `160px` with label radius `11.5/10 * 64 = 73.6px`. On mobile screens, Persian labels ("اسیدیته", "شیرینی") risk clipping against the SVG edge.
  - Container around radar (line 1287) has hardcoded `borderRadius: '16px'` instead of `var(--theme-radius-lg)`.
- **Required Fix**:
  - Expand viewBox to `0 0 200 200` with `radius = 68` and `center = 100`.
  - Polygon fill `var(--theme-accent)` with opacity `0.25`, stroke `var(--theme-accent)` strokeWidth `2.5`, dots `r="3.5" fill="var(--theme-accent)"`.
  - Bind container border-radius to `var(--theme-radius-lg, 16px)`.

### 4. Category Scroll Spy Tabs & Sticky Headers
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:634-710` & `1067-1094`.
- **Defects Identified**:
  - `scrollToCategory` uses hardcoded offset `el.offsetTop - 80`. Because sticky header height is ~110px (logo header + category tabs), clicking a tab hides category title under sticky header.
  - Tab button radius is hardcoded `border-radius: 999px` rather than tokenized `var(--theme-radius-full, 999px)`.
- **Required Fix**:
  - Adjust scroll offset to `el.offsetTop - 125` for clean visibility.
  - Bind `.cm-tab-btn` to `border-radius: var(--theme-radius-full, 999px);`.
  - Active tab: `background: var(--theme-accent); color: var(--theme-accent-fg); border-color: var(--theme-accent); box-shadow: var(--theme-card-shadow);`.

### 5. Menu Item Cards & Hover States
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:849-938` & `1158-1215`.
- **Defects Identified**:
  - Line 863: `.cm-item-card:hover` has hardcoded `box-shadow: 0 4px 16px rgba(0,0,0,0.1)`. This completely ruins `NEO_EDITORIAL`'s `4px 4px 0px #18181B` on hover and is invisible on `OLED_CARBON`.
  - Line 925: `.cm-item-plus-btn` has hardcoded `border-radius: 8px;`.
  - Line 1172: Unavailable badge has hardcoded `background: rgba(0,0,0,0.6); color: #fff;`.
- **Required Fix**:
  - Replace `.cm-item-card:hover` shadow with `box-shadow: var(--theme-card-shadow-hover);`.
  - In `.cm-item-plus-btn`, use `border-radius: var(--theme-radius, 8px);`.
  - Unavailable overlay: `background: rgba(0, 0, 0, 0.7); color: #FFFFFF; backdrop-filter: blur(2px); border-radius: var(--theme-radius);`.

### 6. Item Detail Bottom Drawer Sheet
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:1009-1030` & `1267-1365`.
- **Defects Identified**:
  - Line 1022-1023: `.cm-drawer-sheet` has hardcoded `border-top-left-radius: 24px; border-top-right-radius: 24px; box-shadow: 0 -8px 30px rgba(0,0,0,0.3);`.
  - Hardcoded radiuses in JSX: image `16px` (line 1280), radar container `16px` (line 1287), required badge `4px` (line 1300), modifier options `12px` (line 1307), quantity row `14px` & `10px` (line 1339, 1341), add-to-cart button `14px` and hardcoded shadow `0 4px 12px rgba(0,0,0,0.15)` (line 1357).
- **Required Fix**:
  - Sheet: `border-top-left-radius: var(--theme-radius-lg, 24px); border-top-right-radius: var(--theme-radius-lg, 24px); border-top: 1px solid var(--theme-border); box-shadow: var(--theme-card-shadow-lg);`.
  - All inner elements must bind to `var(--theme-radius)`, `var(--theme-radius-lg)`, and `var(--theme-radius-sm)`.
  - Add to cart button: `background: var(--theme-accent); color: var(--theme-accent-fg); border-radius: var(--theme-radius); box-shadow: var(--theme-card-shadow);`.

### 7. Floating Cart Bar & Bottom Drawer
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:939-956` & `1219-1238`.
- **Defects Identified**:
  - Line 1225: Badge has **`background: '#FFF', color: 'var(--theme-accent)'`**. In `OLED_CARBON`, `--theme-accent` is amber `#F59E0B`. A white circle with amber text causes visual contrast failure and leaks white onto OLED black.
  - Line 1234: Checkout button has **`background: 'rgba(0,0,0,0.2)'`**. In `NEO_EDITORIAL`, `--theme-accent` is black `#18181B`. Black on black is completely invisible!
  - Line 949 & 1234: Hardcoded `border-radius: 16px` and `borderRadius: 10px`.
- **Required Fix**:
  - Badge: `background: var(--theme-surface); color: var(--theme-accent);` (or `background: var(--theme-accent-fg); color: var(--theme-accent);`).
  - Checkout button pill: `background: color-mix(in srgb, var(--theme-accent-fg) 20%, transparent); color: var(--theme-accent-fg); border-radius: var(--theme-radius);`.
  - Cart bar container: `border-radius: var(--theme-radius-lg); box-shadow: var(--theme-card-shadow-lg); border: 1px solid var(--theme-border);`.

### 8. Table Service Hub & FAB
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:957-1008` & `1240-1265`.
- **Defects Identified**:
  - Line 1261: Open state hardcodes **`background: '#EF4444', color: '#FFF'`**.
  - Line 1245-1254: Hardcoded icon colors `#F59E0B`, `#10B981`, `#3B82F6`, `#8B5CF6`.
  - Missing QR Table badge display in Customer Menu header or FAB (e.g. `میز ۱`).
- **Required Fix**:
  - FAB button: `background: tableHubOpen ? 'var(--color-red, #EF4444)' : 'var(--theme-surface)'; color: tableHubOpen ? '#FFFFFF' : 'var(--theme-text)'; border: 1px solid var(--theme-border); box-shadow: var(--theme-card-shadow);`.
  - Hub menu popup: `background: var(--theme-surface); border: 1px solid var(--theme-border); border-radius: var(--theme-radius-lg); box-shadow: var(--theme-card-shadow-lg);`.
  - Table badge: Display table number badge in the header when scanned via QR (e.g. `?table=1` or cafe fallback table).

### 9. View-Only Banner & Checkout Modals
- **Observed Lines**: `src/app/c/[cafeSlug]/page.tsx:712-722` & `1367-1406`.
- **Defects Identified**:
  - Line 712: `.cm-banner-viewonly` hardcodes `#FEF3C7`, `#92400E`, `#FDE68A`.
  - Line 1373: Pay-at-counter modal icon hardcodes `#D1FAE5`, `#059669`.
  - Line 1389: Table-tab split modal icon hardcodes `#DBEAFE`, `#2563EB`.
- **Required Fix**:
  - `.cm-banner-viewonly`: `background: rgba(245, 158, 11, 0.15); color: var(--color-amber, #D97706); border-bottom: 1px solid rgba(245, 158, 11, 0.3);`.
  - Pay-at-counter icon: `background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);`.
  - Table-tab split icon: `background: rgba(37, 99, 235, 0.15); color: #3B82F6; border: 1px solid rgba(37, 99, 235, 0.3);`.
  - Modal container: `border-radius: var(--theme-radius-lg); border: 1px solid var(--theme-border); box-shadow: var(--theme-card-shadow-lg);`.

---

## 4. Comprehensive Inventory of Color Leaks (Line-by-Line)

| # | File & Line | Current Code | Problem / Impact | Recommended Replacement |
|---|---|---|---|---|
| 1 | `page.tsx:631` | `box-shadow: 0 0 50px rgba(0,0,0,0.08)` | Container shadow violates NEO_EDITORIAL | `box-shadow: var(--theme-card-shadow-lg)` |
| 2 | `page.tsx:712-718` | `background: #FEF3C7; color: #92400E; border-bottom: 1px solid #FDE68A` | Blinding bright yellow banner in OLED_CARBON | `background: rgba(245, 158, 11, 0.15); color: var(--color-amber, #D97706); border-bottom: 1px solid rgba(245, 158, 11, 0.3)` |
| 3 | `page.tsx:750` | `background: rgba(255, 255, 255, 0.15)` | Hardcoded white overlay in hero card | `background: color-mix(in srgb, var(--theme-accent-fg) 16%, transparent)` |
| 4 | `page.tsx:753` | `border: 1px solid rgba(255, 255, 255, 0.25)` | Hardcoded white border in hero card | `border: 1px solid color-mix(in srgb, var(--theme-accent-fg) 25%, transparent)` |
| 5 | `page.tsx:782` | `box-shadow: 0 1px 3px rgba(0,0,0,0.1)` | Soft shadow breaks NEO_EDITORIAL brutalist | `box-shadow: var(--theme-card-shadow)` |
| 6 | `page.tsx:863` | `box-shadow: 0 4px 16px rgba(0,0,0,0.1)` | Hover shadow breaks NEO_EDITORIAL & OLED | `box-shadow: var(--theme-card-shadow-hover)` |
| 7 | `page.tsx:925` | `border-radius: 8px` | Plus button radius hardcoded | `border-radius: var(--theme-radius)` |
| 8 | `page.tsx:949` | `border-radius: 16px` | Cart bar radius hardcoded | `border-radius: var(--theme-radius-lg)` |
| 9 | `page.tsx:954` | `box-shadow: 0 8px 30px rgba(0,0,0,0.25)` | Cart bar shadow breaks NEO_EDITORIAL | `box-shadow: var(--theme-card-shadow-lg)` |
| 10 | `page.tsx:968` | `box-shadow: 0 4px 16px rgba(0,0,0,0.15)` | FAB shadow breaks NEO_EDITORIAL | `box-shadow: var(--theme-card-shadow)` |
| 11 | `page.tsx:981` | `border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.18)` | Hub popup radius/shadow breaks themes | `border-radius: var(--theme-radius-lg); box-shadow: var(--theme-card-shadow-lg)` |
| 12 | `page.tsx:1022-1029`| `border-top-*-radius: 24px; box-shadow: 0 -8px 30px rgba(0,0,0,0.3)` | Drawer sheet radius/shadow hardcoded | `border-top-*-radius: var(--theme-radius-lg); box-shadow: var(--theme-card-shadow-lg)` |
| 13 | `page.tsx:1045-1049`| `border-radius: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.25)` | Modal card radius/shadow hardcoded | `border-radius: var(--theme-radius-lg); box-shadow: var(--theme-card-shadow-lg)` |
| 14 | `page.tsx:1172` | `background: 'rgba(0,0,0,0.6)', color: '#fff'` | Out of stock badge colors hardcoded | `background: 'rgba(0, 0, 0, 0.7)', color: '#FFFFFF', borderRadius: 'var(--theme-radius)'` |
| 15 | `page.tsx:1225` | `background: '#FFF', color: 'var(--theme-accent)'` | Cart count white badge fails in OLED_CARBON | `background: 'var(--theme-surface)', color: 'var(--theme-accent)'` |
| 16 | `page.tsx:1234` | `background: 'rgba(0,0,0,0.2)'` | Checkout pill is invisible on black accent | `background: 'color-mix(in srgb, var(--theme-accent-fg) 20%, transparent)'` |
| 17 | `page.tsx:1261` | `background: tableHubOpen ? '#EF4444' : ... color: '#FFF'` | Hardcoded red/white on table FAB | `background: tableHubOpen ? 'var(--color-red, #EF4444)' : ... color: '#FFFFFF'` |
| 18 | `page.tsx:1280-1357`| `borderRadius: '16px' / '12px' / '14px' / '10px'` | Hardcoded drawer radiuses break NEO_EDITORIAL | Bind to `var(--theme-radius)`, `var(--theme-radius-lg)`, `var(--theme-radius-sm)` |
| 19 | `page.tsx:1373` | `background: '#D1FAE5', color: '#059669'` | Bright pastel green icon in dark OLED | `background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)'` |
| 20 | `page.tsx:1389` | `background: '#DBEAFE', color: '#2563EB'` | Bright pastel blue icon in dark OLED | `background: 'rgba(37, 99, 235, 0.15)', color: '#3B82F6', border: '1px solid rgba(37, 99, 235, 0.3)'` |
| 21 | `owner/page.tsx:572`| `const { THEMES } = require("@/lib/themes");` | Dynamic require inside component render | Top-level `import { THEMES } from "@/lib/themes";` |

---

## 5. Verification Plan & Test Strategy

To verify 100% theme fidelity and zero leakages:
1. **TypeScript Typecheck**: Run `npx tsc --noEmit` to guarantee clean interfaces.
2. **Visual Contrast & Theme Verification**:
   - Load `/c/noir-social-club` (OLED_CARBON): Ensure no bright `#FEF3C7`, `#D1FAE5`, or `#FFF` cart badges appear; stamps glow with amber; radar polygon is amber on black.
   - Load `/c/roastery-collective` (NORDIC_MINIMAL): Sandstone warm aesthetic, hazelnut buttons, crisp borders.
   - Test NEO_EDITORIAL: Sharp 0px borders, block shadows `4px 4px 0px #18181B`, high-contrast ivory/black.
   - Test WARM_TERRACOTTA: 22px-30px soft pillowy radiuses, terracotta accent `#C25327`.
   - Test ARTISAN_SEPIA: Handcrafted sepia linen look, roasted bronze accent.
3. **Table FAB & Cart Bar Interaction**:
   - Open and close drawer; ensure modifiers, steppers, and add-to-cart buttons respect theme radius and surface colors.
   - Click table FAB; ensure popup menu uses `--theme-surface`, `--theme-border`, and `--theme-card-shadow`.
