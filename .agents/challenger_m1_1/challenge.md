# Adversarial Challenge Report — Milestone 1: Theme System & Customer Menu Theme Fidelity

**Agent**: `challenger_m1_1`  
**Role**: Empirical Challenger (critic, specialist)  
**Date**: 2026-08-16  
**Target Module**: `src/lib/themes.ts`, `src/app/c/[cafeSlug]/page.tsx`, `src/app/globals.css`  
**Verdict**: `REQUEST_CHANGES`

---

## Challenge Summary

**Overall Risk Assessment**: **HIGH**

While the 5 core theme palettes (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`) exhibit 100% token completeness (18/18 tokens), valid hex/CSS format conformance, and exceptional WCAG AA/AAA contrast ratios (ranging from 4.20:1 up to 19.90:1), empirical stress testing uncovered a critical crash vulnerability in `getTheme()` and `getThemeCssString()` under prototype property / prototype pollution inputs.

---

## Challenges

### [High] Challenge 1: Prototype Property Bypass Causes Unhandled `TypeError` Crash in `getTheme()` and `getThemeCssString()`

- **Assumption Challenged**: The implementation assumes `THEMES[themeId as ThemeId] ?? THEMES.NORDIC_MINIMAL` safely falls back to `THEMES.NORDIC_MINIMAL` for any arbitrary, unexpected, or malicious string passed to `getTheme(themeId)` or `getThemeCssString(themeId)`.
- **Attack Scenario**:
  A malicious client or corrupted database record provides a theme ID matching an inherited JavaScript `Object` prototype property (e.g. `"constructor"`, `"toString"`, `"valueOf"`, `"__proto__"`).
  1. `THEMES["constructor"]` resolves to `[Function: Object]` (which is truthy).
  2. The nullish coalescing operator `??` is bypassed because `[Function: Object]` is neither `null` nor `undefined`.
  3. `getTheme("constructor")` returns `[Function: Object]`.
  4. In `getThemeCssString()`, executing `Object.entries(theme.cssVars)` on `undefined` immediately throws:
     ```
     TypeError: Cannot convert undefined or null to object
         at Object.entries (<anonymous>)
         at getThemeCssString (src/lib/themes.ts:173:17)
     ```
  5. In `/c/[cafeSlug]/page.tsx:611`, accessing `activeTheme.preview.bg` immediately throws:
     ```
     TypeError: Cannot read properties of undefined (reading 'bg')
     ```
- **Blast Radius**: Unhandled server-side 500 error and complete client-side React render crash on the customer menu (`/c/[cafeSlug]`) or Owner Studio preview whenever a cafe has an invalid or prototype property name as its `themeId`.
- **Mitigation**:
  Refactor `getTheme()` in `src/lib/themes.ts` to explicitly check `Object.prototype.hasOwnProperty.call(THEMES, themeId)` (or `Object.hasOwn(THEMES, themeId)`):
  ```typescript
  export function getTheme(themeId?: string): ThemeDefinition {
    if (typeof themeId === "string" && Object.prototype.hasOwnProperty.call(THEMES, themeId)) {
      return THEMES[themeId as ThemeId];
    }
    return THEMES.NORDIC_MINIMAL;
  }

  export function getThemeCssString(themeId?: string | ThemeId): string {
    const theme = getTheme(themeId as string);
    return Object.entries(theme.cssVars)
      .map(([key, value]) => `${key}: ${value};`)
      .join(" ");
  }
  ```

---

## Empirical Stress Test Results

A test harness (`tests/verify-theme-adversarial.ts`) with 91 discrete assertion checks was executed against `src/lib/themes.ts`:

| Test Suite | Scope | Total Tests | Passed | Failed | Status |
|------------|-------|-------------|--------|--------|--------|
| **Suite 1** | Theme Definition Integrity & 100% Token Parity | 17 | 17 | 0 | **PASS** |
| **Suite 2** | Color, Radius, Typography & Shadow Syntax Verification | 25 | 25 | 0 | **PASS** |
| **Suite 3** | WCAG AA Accessibility Contrast Ratios | 20 | 20 | 0 | **PASS** |
| **Suite 4** | Adversarial Fallback & Error Resilience | 15 | 12 | 3 | **FAIL** |
| **Suite 5** | CSS String Generator Correctness & Syntax | 10 | 10 | 0 | **PASS** |
| **Suite 6** | Visual Identity Differentiation & Style Invariants | 4 | 4 | 0 | **PASS** |
| **TOTAL** | **Comprehensive Empirical Theme Verification** | **91** | **88** | **3** | **REQUEST_CHANGES** |

### Detailed Stress Results:

1. **Token Parity & Completeness (100% Pass)**:
   - All 5 themes (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`) contain all 18 required tokens:
     - Backgrounds: `--theme-bg`, `--theme-bg-2`
     - Surfaces & Borders: `--theme-surface`, `--theme-border`
     - Typography: `--theme-text`, `--theme-text-2`, `--theme-font-weight-display`
     - Accents: `--theme-accent`, `--theme-accent-fg`, `--theme-accent-2`, `--theme-accent-glow`
     - Radii: `--theme-radius-sm`, `--theme-radius`, `--theme-radius-lg`, `--theme-radius-full`
     - Shadows: `--theme-card-shadow`, `--theme-card-shadow-hover`, `--theme-card-shadow-lg`

2. **WCAG Contrast Ratios (100% Pass)**:
   - `NORDIC_MINIMAL`:
     - Primary Text vs Surface: **16.50:1** (AAA)
     - Primary Text vs Background: **15.80:1** (AAA)
     - Muted Text vs Surface: **4.53:1** (AA)
     - Accent FG vs Accent: **5.58:1** (AA)
   - `OLED_CARBON`:
     - Primary Text vs Surface: **16.28:1** (AAA)
     - Primary Text vs Background: **18.36:1** (AAA)
     - Muted Text vs Surface: **7.04:1** (AAA)
     - Accent FG vs Accent: **9.33:1** (AAA)
   - `ARTISAN_SEPIA`:
     - Primary Text vs Surface: **16.04:1** (AAA)
     - Primary Text vs Background: **14.73:1** (AAA)
     - Muted Text vs Surface: **6.41:1** (AAA)
     - Accent FG vs Accent: **6.59:1** (AAA)
   - `NEO_EDITORIAL`:
     - Primary Text vs Surface: **19.90:1** (AAA)
     - Primary Text vs Background: **18.04:1** (AAA)
     - Muted Text vs Surface: **7.73:1** (AAA)
     - Accent FG vs Accent: **17.72:1** (AAA)
   - `WARM_TERRACOTTA`:
     - Primary Text vs Surface: **15.48:1** (AAA)
     - Primary Text vs Background: **14.13:1** (AAA)
     - Muted Text vs Surface: **6.25:1** (AAA)
     - Accent FG vs Accent: **4.20:1** (AA UI / Large Text)

3. **Adversarial Inputs Matrix**:
   - `undefined` → `THEMES.NORDIC_MINIMAL` (PASS)
   - `null` → `THEMES.NORDIC_MINIMAL` (PASS)
   - `""` (empty string) → `THEMES.NORDIC_MINIMAL` (PASS)
   - `"UNKNOWN_ID"` → `THEMES.NORDIC_MINIMAL` (PASS)
   - `123` / `{}` / `[]` / `false` → `THEMES.NORDIC_MINIMAL` (PASS)
   - `"constructor"` → Returns `[Function: Object]` -> `getThemeCssString` crashes with `TypeError` (**FAIL**)
   - `"toString"` → Returns `[Function: toString]` -> `getThemeCssString` crashes with `TypeError` (**FAIL**)
   - `"__proto__"` → Returns `Object.prototype` -> `getThemeCssString` crashes with `TypeError` (**FAIL**)

---

## Unchallenged Areas

- **KDS Real-time SSE endpoints** (`/api/kds/stream/*`): Dedicated to Milestone 2.
- **Admin/Owner Studio CRUD APIs**: Dedicated to Milestones 2 & 3.

---

## Recommendations for Worker

1. In `src/lib/themes.ts`, update `getTheme()` to validate own properties via `Object.prototype.hasOwnProperty.call(THEMES, themeId)`.
2. In `src/lib/themes.ts`, update `getThemeCssString()` to reuse `getTheme(themeId as string)` rather than re-evaluating `THEMES[...]`.
3. In `src/app/owner/page.tsx:572`, replace `THEMES[themeId] ?? THEMES.NORDIC_MINIMAL` with `getTheme(themeId)` for consistency.
