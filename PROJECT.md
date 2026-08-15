# Project: CafeChi Platform Visual Perfection, 5-Theme Design System & Multi-Repo Integrity

## Architecture
- **Framework**: Next.js 16.3.1 (App Router + Turbopack), React 19.2.8, TypeScript 5.
- **Database & ORM**: SQLite (`prisma/dev.db`) with Prisma 7.9.1.
- **Styling Architecture**: Custom scoped Vanilla CSS variable token system with 5 dynamic cafe themes (`src/lib/themes.ts`, `src/app/globals.css`). Scoped CSS modules & component classes (no external Tailwind dependency).
- **Persian Typography**: Vazirmatn font with RTL alignment and Plus Jakarta Sans / Geist Mono fallbacks.
- **Key Modules**:
  - Customer Menu (`/c/[cafeSlug]`): Dynamic theme-injected digital menu with "همان همیشگی", loyalty stamps, 5-axis coffee radar, drawer sheet, floating cart, and table service hub.
  - KDS Barista Station (`/kds/[cafeSlug]`): Real-time SSE order board, SLA timers, item-by-item status tracking, table call alerts, and stock toggle.
  - Owner Studio (`/owner`): Dashboard analytics, menu item/category CRUD, cafe branding/theme settings, table QR generation, and order history.
  - Super Admin Dashboard (`/admin`): Platform analytics, cafe approval, user management, and system metrics.
  - Discovery Marketplace (`/`): Cafe directory, search, city/neighborhood filters, interactive map view.
  - Auth & Payment (`/login`, `/register`, `/mock-payment`): Authentication forms, session management, mock payment gateway simulation.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 5-Theme Visual System | `NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA` with rich backgrounds, surfaces, borders, elevations, and accents | M1 | ORIGINAL_REQUEST §1 |
| 2 | Customer Menu Theme Injection | 100% theme fidelity on `/c/[cafeSlug]` with scoped CSS variables and zero hardcoded color leakages | M1 | ORIGINAL_REQUEST §1 |
| 3 | "همان همیشگی" (Haman Hamishegi) | Favorite reorder widget with glassmorphism, quick add, and theme styling | M1 | ORIGINAL_REQUEST §1 |
| 4 | Loyalty Stamp Card | 6-slot loyalty card with active accent illumination and theme background | M1 | ORIGINAL_REQUEST §1 |
| 5 | Dynamic Coffee Flavor Radar | 5-axis SVG flavor profile radar chart adhering to active cafe theme colors | M1 | Survey findings |
| 6 | Menu Drawer & Floating Cart | Item customization drawer, modifiers, floating bottom cart bar and bottom sheet | M1 | ORIGINAL_REQUEST §1 |
| 7 | Table Service Hub & FAB | Table QR integration, call waiter, bill, water, and POS requests | M1 | ORIGINAL_REQUEST §1 |
| 8 | KDS Barista UI Overhaul | Complete migration from unstyled Tailwind classes to native CSS design system with dark barista mode | M2 | Survey findings |
| 9 | KDS SSE & REST Alignment | Fix `INITIAL_STATE` array parsing, `/api/orders/items/[id]`, table service dismiss PATCH, stock loading | M2 | Survey findings |
| 10 | Owner Categories API | Create `POST /api/owner/menu/categories` route for category creation | M2 | Survey findings |
| 11 | Owner Studio Mobile Layout | Responsive collapsible sidebar, mobile navigation, and theme picker preview | M3 | ORIGINAL_REQUEST §2 |
| 12 | Super Admin Mobile Layout | Responsive sidebar, grid collapse, and horizontal table scroll wrappers | M3 | ORIGINAL_REQUEST §2 |
| 13 | Discovery Marketplace Polish | Responsive grid `minmax(min(100%, 280px), 1fr)`, neighborhood quick filters, hero search polish | M3 | ORIGINAL_REQUEST §2 |
| 14 | Auth & Mock Payment Polish | Persian typography, Link components, clean focus rings, payment gateway feedback | M3 | ORIGINAL_REQUEST §2 |
| 15 | Code Cleanliness & Lint Pass | Resolve ESLint errors (HTML `<a>` to `<Link>`, missing keys, require import, pure renders) | M3 | Survey findings |
| 16 | Comprehensive E2E Test Suite | 4-tier opaque-box test suite for themes, routes, APIs, and real-world workflows | M4 | Project Pattern (Dual Track) |
| 17 | Clean TypeScript & Production Build | `npx tsc --noEmit` and `npm run build` zero-error verification | M5 | ORIGINAL_REQUEST §3 |
| 18 | Dual Git Repo Parity | Synchronize all commits to both `RMNO21/cafechi-platform` and `RMNO21/cafechi-platform-24d8b` | M5 | ORIGINAL_REQUEST §3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | 5-Theme Design System & Customer Menu Fidelity | `src/lib/themes.ts`, `src/app/c/[cafeSlug]/page.tsx`, `src/app/globals.css` | none | IN_PROGRESS (`7bb1f960-843c-4713-8a81-da7d1d9f03e1`) |
| M2 | KDS Barista Board Overhaul & API Contract Alignment | `src/app/kds/[cafeSlug]/page.tsx`, `src/app/api/owner/menu/categories/route.ts`, KDS endpoints | M1 | PLANNED |
| M3 | Platform Pages Responsive Polish & Lint Cleanup | `src/app/page.tsx`, `src/app/owner/page.tsx`, `src/app/admin/page.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/mock-payment/page.tsx` | M1 | PLANNED |
| M4 | E2E Testing Suite (Dual Track) | Test runner and comprehensive test suite covering all 5 tiers | M1, M2, M3 | IN_PROGRESS (`0758dded-0032-42c5-9696-94e1821243ff`) |
| M5 | Final Validation, TypeScript Build & Multi-Repo Sync | TypeScript build pass, adversarial hardening, dual-repo push to origin and netlify-repo | M1, M2, M3, M4 | PLANNED |

## Interface Contracts

### Theme System Interface (`src/lib/themes.ts`)
```typescript
export type ThemeId =
  | "NORDIC_MINIMAL"
  | "OLED_CARBON"
  | "ARTISAN_SEPIA"
  | "NEO_EDITORIAL"
  | "WARM_TERRACOTTA";

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
}

export interface ThemeStyles {
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  fontDisplay: string;
  fontDisplayWeight: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  nameFa: string;
  nameEn: string;
  tagline: string;
  colors: ThemeColors;
  styles: ThemeStyles;
}
```

### KDS API Contracts
- `GET /api/kds/stream/[cafeSlug]`: SSE stream emitting `INITIAL_STATE` (`payload: Order[]`), `ORDER_CREATED`, `ORDER_UPDATED`, `ITEM_STATUS_CHANGED`, `TABLE_SERVICE_REQUEST`.
- `PATCH /api/orders/items/[orderItemId]`: Body `{ status: OrderItemStatus }`.
- `PATCH /api/table-service`: Body `{ id: string, status: "RESOLVED" | "CANCELLED" }`.
- `POST /api/owner/menu/categories`: Body `{ nameFa: string, nameEn?: string, icon?: string, sortOrder?: number }`.

## Code Layout
- `src/lib/themes.ts` — Theme definitions, tokens, and helper utilities.
- `src/app/globals.css` — Global styles, Persian Vazirmatn typography, CSS variables, utility components.
- `src/app/c/[cafeSlug]/page.tsx` — Customer menu page and dynamic theme engine.
- `src/app/kds/[cafeSlug]/page.tsx` — KDS Barista Station order board.
- `src/app/owner/page.tsx` — Owner Studio dashboard.
- `src/app/admin/page.tsx` — Super Admin dashboard.
- `src/app/page.tsx` — Discovery Marketplace.
- `src/app/login/page.tsx` & `src/app/register/page.tsx` — Authentication pages.
- `src/app/mock-payment/page.tsx` — Payment gateway simulation.
- `src/app/api/**` — Next.js Route handlers.
- `tests/**` — Comprehensive E2E and unit test suites.
