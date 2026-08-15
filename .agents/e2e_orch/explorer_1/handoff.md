# Handoff Report: CafeChi E2E Testing Framework Survey & Architecture Proposal

**Track**: E2E Testing Track (M4)  
**Agent**: Explorer 1 (`explorer_1`)  
**Parent**: E2E Testing Track Orchestrator (`0758dded-0032-42c5-9696-94e1821243ff`)  
**Date**: 2026-08-16  

---

## 1. Observation

### 1.1 Codebase & Runtime Environment
- **Runtime Environment**:
  - `node`: v26.5.1
  - `tsx`: v4.23.12 (already present in `devDependencies` of `package.json`, line 44)
  - `typescript`: v5.0 (verified with `npx tsc --noEmit` returning exit code 0)
  - `next`: 16.3.1 (App Router + Turbopack)
  - `react`: 19.2.8
  - `prisma`: 7.9.1 with SQLite database located at `prisma/dev.db` via `@prisma/adapter-better-sqlite3` (`src/lib/db.ts`)
- **Existing Test Infrastructure**:
  - No `tests/` directory currently exists in the repository.
  - No existing testing framework (such as Jest or Vitest) is installed in `package.json`.
  - Directly running TypeScript modules via `npx tsx <path>` executes with near-instant startup time (<150ms) and natively resolves TypeScript path mappings `@/*` defined in `tsconfig.json` (line 22: `"@/*": ["./src/*"]`).
  - Next.js Route handlers in `src/app/api/**` accept standard Web API `Request` objects and return standard `Response`/`NextResponse` instances, enabling in-process testing against live database instances without requiring an external HTTP server daemon.

### 1.2 Survey of the 12 Core Features

| # | Feature Name | Primary Source Files | Observed Implementation Details |
|---|---|---|---|
| 1 | **5-Theme Definitions & Tokens** | `src/lib/themes.ts`, `src/app/globals.css`, `src/types/index.ts` | 5 themes defined in `THEMES` dictionary: `NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`. Each theme specifies 13 CSS tokens (`--theme-bg`, `--theme-bg-2`, `--theme-surface`, `--theme-border`, `--theme-text`, `--theme-text-2`, `--theme-accent`, `--theme-accent-fg`, `--theme-accent-2`, `--theme-card-shadow`, `--theme-radius`, `--theme-radius-lg`, `--theme-font-weight-display`). `getThemeCssString()` serializes token pairs into valid CSS strings. `getTheme()` provides fallback to `NORDIC_MINIMAL`. |
| 2 | **Customer Menu Theme Injection** | `src/app/c/[cafeSlug]/page.tsx`, `src/app/api/menu/[cafeSlug]/route.ts` | Dynamic customer page fetches cafe record by slug. Resolves theme via `getTheme(cafe.themeId)`. Injects tokens into `:root, body` via `<style>` tag and applies them to root wrapper `.cm-root-wrapper`. Scoped CSS classes (`.cm-container`, `.cm-header`, `.cm-item-card`, `.cm-tab-btn`) consume `var(--theme-*)` exclusively with zero hardcoded theme color leaks. View-only banner renders when `workflowMode === 'VIEW_ONLY'`. |
| 3 | **"همان همیشگی" (Haman Hamishegi) Widget** | `src/app/c/[cafeSlug]/page.tsx`, `src/app/api/the-usual/[cafeSlug]/route.ts` | Rendered under `.cm-usual-hero` with background `linear-gradient(135deg, var(--theme-accent), var(--theme-accent-2))`. Contains horizontal scroll list (`.cm-usual-scroll`) of `.cm-usual-card` with glassmorphic backdrop filter. Provides 1-click Quick Add button (`.cm-usual-btn`). Gracefully hides when customer has no past orders. |
| 4 | **Loyalty Stamp Card** | `src/app/c/[cafeSlug]/page.tsx`, `prisma/schema.prisma` (`LoyaltyStamp`), `src/types/index.ts` | Displays 6-slot digital stamp card (`.cm-loyalty-card`) when `cafe.loyaltyProgram === true`. Slots 1 to `stampsCount` gain `.active` class with `var(--theme-accent)` fill and coffee icon. Inactive slots display dashed border. Active badge displays `{stampsCount} از ۶ مهر`. |
| 5 | **Coffee Flavor Radar Chart** | `src/app/c/[cafeSlug]/page.tsx` (`CoffeeRadar` component), `src/lib/validations.ts` (`CoffeeProfileSchema`) | 5-axis SVG radar chart (size 160x160): Acidity (اسیدیته), Body (بادی), Sweetness (شیرینی), Bitterness (تلخی), Aroma (عطر). Trigonometric vertices calculated as `x = center + r * cos(angle)`, `y = center - r * sin(angle)` with `angle = (π/2) - (2π * i / 5)`. 5 concentric polygon reference rings at levels [2, 4, 6, 8, 10]. Data polygon rendered with `fill="var(--theme-accent)"` at 0.3 opacity and accent stroke. |
| 6 | **Menu Drawer & Floating Cart** | `src/app/c/[cafeSlug]/page.tsx`, `src/app/api/orders/route.ts` | Clicking a menu card opens `.cm-drawer-sheet` overlay. Supports modifier groups with radio/checkbox selection, calculates price delta additions in real-time, provides quantity counter with minimum clamp at 1. Floating cart bar (`.cm-cart-bar`) appears fixed at bottom when `cartCount > 0` with item counter badge and total price in Tomans. Checkout routes dynamically based on `workflowMode`: upfront payment redirects to `/mock-payment`, counter payment displays order code modal, table tab split shows confirmation modal. |
| 7 | **Table Service Hub & FAB** | `src/app/c/[cafeSlug]/page.tsx`, `src/app/api/table-service/route.ts` | Floating Action Button (`.cm-table-fab`) toggles service menu with 4 action types: `CALL_WAITER`, `REQUEST_BILL`, `REQUEST_WATER`, `REQUEST_POS`. Submits POST to `/api/table-service` and emits `TABLE_SERVICE` event to KDS SSE stream. |
| 8 | **KDS Barista Board & SSE** | `src/app/kds/[cafeSlug]/page.tsx`, `src/app/api/kds/stream/[cafeSlug]/route.ts`, `src/app/api/orders/items/[orderItemId]/route.ts` | Server-Sent Events stream (`GET /api/kds/stream/[cafeSlug]`) emitting `INITIAL_STATE`, `NEW_ORDER`, `ITEM_STATUS_UPDATE`, `TABLE_SERVICE`, `ITEM_86ED`, `ORDER_READY`. Station filtering by `HOT_BAR`, `COLD_BAR`, `KITCHEN`, `PASTRY`, `EXPEDITER`. Item status progression: `PENDING` -> `IN_PROGRESS` -> `DONE`. Auto-transitions order status to `READY` when all items are marked `DONE`. Real-time SLA timer tracking with visual warning thresholds. |
| 9 | **Owner Studio & Menu/Category CRUD** | `src/app/owner/page.tsx`, `src/app/api/owner/cafe/route.ts`, `src/app/api/owner/menu/route.ts`, `src/app/api/owner/staff/route.ts` | 5 tabs: Profile, Menu, Theme, Staff, Tables. Live theme picker preview updating cafe `themeId`. Menu item CRUD supporting prices, discounts, tags, allergens, and modifier groups. Category display ordering. Table QR token generation. Staff permission management with station assignment. Protected by `CAFE_OWNER` auth session. |
| 10 | **Super Admin Dashboard** | `src/app/admin/page.tsx`, `src/app/api/admin/cafes/route.ts`, `src/app/api/admin/users/route.ts` | Approval queue for cafes with `isApproved` toggle. System metrics and cafe count. User directory across all roles (`SUPER_ADMIN`, `CAFE_OWNER`, `STAFF`, `CUSTOMER`). Protected by `SUPER_ADMIN` auth session. |
| 11 | **Discovery Marketplace** | `src/app/page.tsx`, `src/app/api/discovery/route.ts`, `src/lib/haversine.ts` | Public cafe directory querying `isApproved: true` & `isActive: true` cafes. Search filtering on name, description, address. Amenity filters (`wifi`, `smoking`, `outdoor`, `board_games`, `work_friendly`, `pet_friendly`). Haversine distance calculation and radius filtering. Open-now determination based on day and opening hours. |
| 12 | **Auth & Mock Payment Gateway** | `src/app/login/page.tsx`, `src/app/register/page.tsx`, `src/app/mock-payment/page.tsx`, `src/app/api/auth/*` | Registration and Login with `bcryptjs` password verification and `jose` HS256 JWT tokens. Session cookie management and Bearer token parsing in `getSession(req)`. Mock payment gateway simulation at `/mock-payment?orderId=[id]` verifying order existence, simulating gateway latency, and updating order status to `CONFIRMED` and `PAID`. |

---

## 2. Logic Chain

1. **Test Runner Tooling Rationale**:
   - `tsx` (v4.23.12) is already installed as a dependency in the project.
   - It executes TypeScript directly without a pre-compilation step (`npx tsx tests/runner.ts`).
   - It supports full `@/*` path mapping resolution without extra bundler setup.
   - It avoids external heavyweight test runner overhead while providing 100% deterministic control over test execution, assertion messages, colored formatting, and exit codes.
2. **Execution Strategy (In-Process Direct Testing)**:
   - Next.js Route handlers (`export async function GET/POST/PATCH/DELETE`) are pure async functions taking a standard `Request` and returning a `Response`.
   - By constructing simulated `Request` objects with JSON bodies, query parameters, and `Authorization: Bearer <token>` headers, tests can exercise the complete application stack (route validation with Zod, session verification with Jose, database operations with Prisma SQLite) with zero network latency and maximum isolation.
3. **4-Tier Architecture Rationale**:
   - **Tier 1 (Feature Coverage ≥60 tests)**: Validates that each of the 12 features fulfills its primary operational contract (≥5 tests per feature).
   - **Tier 2 (Boundary & Corner Cases ≥60 tests)**: Validates system resilience against extreme values, missing data, negative numbers, overflow, unauthenticated access, and schema violations (≥5 tests per feature).
   - **Tier 3 (Cross-Feature Combinations ≥15 tests)**: Validates multi-module interactions (e.g. Theme change reflects in Customer Menu; Customer Order flows into KDS and Loyalty; Staff 86-ing updates Customer Menu availability).
   - **Tier 4 (Real-World Workload Scenarios ≥6 scenarios)**: Simulates complete end-to-end user journeys (e.g. Full dine-in experience, High-volume morning rush, 86-stock depletion & recovery, Multi-theme onboarding & admin approval).
   - **Total**: 60 + 60 + 15 + 6 = 141 tests, surpassing the project requirement of ≥140 tests.

---

## 3. Proposed Test Suite Blueprint

### 3.1 Harness Architecture (`tests/harness.ts`)

```typescript
// Core capabilities provided by tests/harness.ts:
// 1. Assertion Library:
//    assert(cond, msg), assertEqual(actual, expected, msg), assertDeepEqual(a, b, msg),
//    assertThrows(fn, msg), assertThrowsAsync(fn, msg), assertDefined(val, msg),
//    assertInRange(val, min, max, msg), assertMatches(val, regex, msg), assertIncludes(arr, item, msg)
// 2. Test Runner Framework:
//    describe(name, fn), it(name, fn), test(name, fn),
//    beforeAll(fn), afterAll(fn), beforeEach(fn), afterEach(fn)
// 3. Test Fixture & Auth Helpers:
//    generateTestToken(payload), createMockRequest(url, options), createAuthHeader(role, cafeId)
// 4. Reporting & Metrics:
//    Colorized terminal output (pass/fail badges, elapsed time in ms, summary table by Tier)
//    Exit code 0 on complete pass, 1 on any failure.
```

### 3.2 Tier 1: Feature Coverage (60 Tests across 12 Features)

- **Feature 1: 5-Theme Definitions & Tokens (5 tests)**
  - `T1.1.1`: Verify all 5 theme IDs (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`) exist in `THEMES`.
  - `T1.1.2`: Verify each theme defines all 13 required CSS variable tokens.
  - `T1.1.3`: Verify `getThemeCssString()` generates valid CSS variable syntax with colons and semicolons.
  - `T1.1.4`: Verify `getTheme()` correctly retrieves the requested theme definition.
  - `T1.1.5`: Verify `THEME_LIST` contains exactly 5 complete theme objects with Persian names and previews.
- **Feature 2: Customer Menu Theme Injection (5 tests)**
  - `T1.2.1`: Verify `/api/menu/[cafeSlug]` returns 200 with cafe theme ID for valid slug.
  - `T1.2.2`: Verify menu categories and items are returned in correct `displayOrder`.
  - `T1.2.3`: Verify parsed amenities and opening hours JSON structures in menu response.
  - `T1.2.4`: Verify modifier groups are populated with default options.
  - `T1.2.5`: Verify unapproved cafes return 404 in customer menu API.
- **Feature 3: "همان همیشگی" (Haman Hamishegi) (5 tests)**
  - `T1.3.1`: Verify `/api/the-usual/[cafeSlug]` returns empty array for guest (unauthenticated) customer.
  - `T1.3.2`: Verify `/api/the-usual/[cafeSlug]` returns past delivered items for logged-in customer.
  - `T1.3.3`: Verify returned items are ordered by reorder frequency.
  - `T1.3.4`: Verify unavailable (86'd) items are filtered out of the recommendations.
  - `T1.3.5`: Verify maximum 3 items are returned by the endpoint.
- **Feature 4: Loyalty Stamp Card (5 tests)**
  - `T1.4.1`: Verify customer receives loyalty stamp record creation upon placing order.
  - `T1.4.2`: Verify loyalty stamps count increments with subsequent orders.
  - `T1.4.3`: Verify maxStamps defaults to 6 in database schema.
  - `T1.4.4`: Verify loyalty stamp query returns correct count for customer at cafe.
  - `T1.4.5`: Verify loyalty stamps are isolated per cafe per customer.
- **Feature 5: Coffee Flavor Radar Chart (5 tests)**
  - `T1.5.1`: Verify `CoffeeProfileSchema` validates 5 radar axes (acidity, body, sweetness, bitterness, aroma).
  - `T1.5.2`: Verify radar axis values are bounded within range [1, 10].
  - `T1.5.3`: Verify menu item coffeeProfile correctly parses origin, process, and altitude.
  - `T1.5.4`: Verify flavorNotes array is properly deserialized from menu item.
  - `T1.5.5`: Verify trigonometric coordinates calculation produces valid 2D polygon points for 5 vertices.
- **Feature 6: Menu Drawer & Floating Cart (5 tests)**
  - `T1.6.1`: Verify `CartItemSchema` validates menu item ID, quantity, and selected modifiers.
  - `T1.6.2`: Verify cart total calculation accounts for base price plus modifier price deltas multiplied by quantity.
  - `T1.6.3`: Verify order creation (`POST /api/orders`) creates order items with selected modifiers JSON.
  - `T1.6.4`: Verify `PAY_UPFRONT_BUZZER` order creates buzzer number in range [1, 99].
  - `T1.6.5`: Verify `TABLE_TAB_SPLIT` order initializes with status `CONFIRMED` and `UNPAID`.
- **Feature 7: Table Service Hub & FAB (5 tests)**
  - `T1.7.1`: Verify `POST /api/table-service` creates a request with status `PENDING`.
  - `T1.7.2`: Verify all 4 service types (`CALL_WAITER`, `REQUEST_BILL`, `REQUEST_WATER`, `REQUEST_POS`) are accepted.
  - `T1.7.3`: Verify table service request emits `TABLE_SERVICE` event to KDS queue.
  - `T1.7.4`: Verify `GET /api/table-service?cafeId=[id]` returns pending requests for staff.
  - `T1.7.5`: Verify `PATCH /api/table-service` updates request status to `DONE`.
- **Feature 8: KDS Barista Board & SSE (5 tests)**
  - `T1.8.1`: Verify `GET /api/kds/stream/[cafeSlug]` establishes SSE connection with `text/event-stream` headers.
  - `T1.8.2`: Verify initial state event contains active orders with modifiers and table info.
  - `T1.8.3`: Verify `PATCH /api/orders/items/[orderItemId]` updates item status to `IN_PROGRESS`.
  - `T1.8.4`: Verify marking all items in an order `DONE` auto-transitions order status to `READY`.
  - `T1.8.5`: Verify station status updates emit `ITEM_STATUS_UPDATE` and `ORDER_READY` SSE events.
- **Feature 9: Owner Studio & Menu/Category CRUD (5 tests)**
  - `T1.9.1`: Verify `GET /api/owner/cafe` returns full cafe configuration for authenticated owner.
  - `T1.9.2`: Verify `PATCH /api/owner/cafe` updates cafe `themeId` and amenities.
  - `T1.9.3`: Verify `POST /api/owner/menu` creates new menu item with modifier groups.
  - `T1.9.4`: Verify `PATCH /api/owner/menu/[itemId]` modifies item price and availability.
  - `T1.9.5`: Verify `POST /api/owner/staff` creates or updates staff station permissions.
- **Feature 10: Super Admin Dashboard (5 tests)**
  - `T1.10.1`: Verify `GET /api/admin/cafes` returns all cafes with owner details and order counts.
  - `T1.10.2`: Verify `PATCH /api/admin/cafes/[cafeId]` updates cafe `isApproved` status.
  - `T1.10.3`: Verify `GET /api/admin/users` returns registered users list.
  - `T1.10.4`: Verify non-admin role receives 403 Forbidden on admin endpoints.
  - `T1.10.5`: Verify admin metrics aggregate total cafes and user counts.
- **Feature 11: Discovery Marketplace (5 tests)**
  - `T1.11.1`: Verify `GET /api/discovery` returns approved and active cafes only.
  - `T1.11.2`: Verify text search `?q=روستری` filters matching cafe names or descriptions.
  - `T1.11.3`: Verify amenity filter `?wifi=true` filters cafes with WiFi.
  - `T1.11.4`: Verify Haversine formula correctly computes distance in kilometers.
  - `T1.11.5`: Verify openNow filter evaluates opening hours against current day.
- **Feature 12: Auth & Mock Payment Gateway (5 tests)**
  - `T1.12.1`: Verify `POST /api/auth/register` creates user with hashed password and returns token.
  - `T1.12.2`: Verify `POST /api/auth/login` verifies bcrypt password and sets session cookie.
  - `T1.12.3`: Verify `GET /api/auth/me` returns current user payload from JWT token.
  - `T1.12.4`: Verify `GET /api/orders/[orderId]` retrieves order details for payment verification.
  - `T1.12.5`: Verify `PATCH /api/orders/[orderId]` transitions order status to `CONFIRMED` upon payment completion.

### 3.3 Tier 2: Boundary & Corner Cases (60 Tests across 12 Features)

- **Feature 1 Boundary (5 tests)**:
  - `T2.1.1`: Unknown/invalid theme ID fallback to `NORDIC_MINIMAL`.
  - `T2.1.2`: Empty string theme ID fallback behavior.
  - `T2.1.3`: Validation that all theme color values are non-empty valid hex strings.
  - `T2.1.4`: Border-radius token in `NEO_EDITORIAL` is strictly `"0px"`.
  - `T2.1.5`: Theme font weight display is integer-equivalent string ("800" or "900").
- **Feature 2 Boundary (5 tests)**:
  - `T2.2.1`: Menu request with non-existent cafe slug returns 404.
  - `T2.2.2`: Cafe with zero categories returns empty categories array without throwing.
  - `T2.2.3`: Category with zero available items returns empty menuItems array.
  - `T2.2.4`: Cafe with special Persian characters in slug is handled properly.
  - `T2.2.5`: Inactive category (`isActive: false`) items are omitted from public menu.
- **Feature 3 Boundary (5 tests)**:
  - `T2.3.1`: Customer with only cancelled/pending orders receives empty "the usual" list.
  - `T2.3.2`: All past ordered items 86'd (unavailable) returns empty list gracefully.
  - `T2.3.3`: Reorder count tie breaker preserves deterministic ordering.
  - `T2.3.4`: Customer with >50 past orders queries efficiently within limit.
  - `T2.3.5`: Non-existent cafe slug returns 404 in the-usual endpoint.
- **Feature 4 Boundary (5 tests)**:
  - `T2.4.1`: Customer with 0 stamps receives stampsCount: 0.
  - `T2.4.2`: Customer reaching exactly 6 stamps does not cause arithmetic overflow.
  - `T2.4.3`: Repeated orders past max stamps cap or cycle correctly.
  - `T2.4.4`: Stamps belonging to Cafe A are not visible when querying Cafe B.
  - `T2.4.5`: Unauthenticated order does not create orphaned stamp record.
- **Feature 5 Boundary (5 tests)**:
  - `T2.5.1`: Radar axis value below minimum (<1) rejected by Zod schema.
  - `T2.5.2`: Radar axis value above maximum (>10) rejected by Zod schema.
  - `T2.5.3`: Decimal radar axis values (e.g. 7.5) validate or coerce properly.
  - `T2.5.4`: Menu item with `coffeeProfile: null` omits radar without throwing.
  - `T2.5.5`: All 5 axes set to identical extreme value (all 1s or all 10s) produce valid polygon.
- **Feature 6 Boundary (5 tests)**:
  - `T2.6.1`: Order with 0 items rejected by `CreateOrderSchema` (min 1).
  - `T2.6.2`: Item quantity set to 0 or negative number rejected.
  - `T2.6.3`: Required modifier group missing selection rejected.
  - `T2.6.4`: Exceeding `maxSelection` in modifier group rejected.
  - `T2.6.5`: Order containing unavailable (86'd) item rejected with 400.
- **Feature 7 Boundary (5 tests)**:
  - `T2.7.1`: Table service request with invalid `requestType` rejected.
  - `T2.7.2`: Request note exceeding 200 characters rejected by validation schema.
  - `T2.7.3`: Non-existent tableId falls back gracefully to cafe default table.
  - `T2.7.4`: Rapid consecutive table service requests create discrete records.
  - `T2.7.5`: Table service PATCH with invalid status returns 400.
- **Feature 8 Boundary (5 tests)**:
  - `T2.8.1`: KDS stream connection to non-existent cafe returns 404.
  - `T2.8.2`: KDS initial state when cafe has zero active orders returns empty array.
  - `T2.8.3`: Updating item station status for non-existent orderItemId returns 404.
  - `T2.8.4`: Order with single item marking that item DONE immediately transitions order to READY.
  - `T2.8.5`: KDS event queue trimming when queue exceeds 500 events.
- **Feature 9 Boundary (5 tests)**:
  - `T2.9.1`: Menu item creation with negative price rejected by Zod schema.
  - `T2.9.2`: Prep time minutes set to 0 or >120 rejected.
  - `T2.9.3`: Owner updating menu item belonging to another cafe returns 404/403.
  - `T2.9.4`: Staff member without `canEditMenu` permission blocked from modifying items.
  - `T2.9.5`: Duplicate staff assignment to same cafe handled via upsert.
- **Feature 10 Boundary (5 tests)**:
  - `T2.10.1`: Non-admin user updating cafe approval status returns 403.
  - `T2.10.2`: Setting `isActive: false` on cafe removes it from public discovery.
  - `T2.10.3`: Idempotent approval of already-approved cafe returns 200.
  - `T2.10.4`: Admin cafe list query with 0 orders handles null count gracefully.
  - `T2.10.5`: Admin user list query returns passwordHash omitted from payload.
- **Feature 11 Boundary (5 tests)**:
  - `T2.11.1`: Search query with special characters / SQL injection attempt safely handled.
  - `T2.11.2`: Negative radius in discovery query rejected (<0.5 km).
  - `T2.11.3`: Coordinates out of range (lat > 90 or lng > 180) rejected.
  - `T2.11.4`: Discovery query when no cafes match criteria returns empty array `[]`.
  - `T2.11.5`: Discovery query when coordinates omitted skips distance calculation cleanly.
- **Feature 12 Boundary (5 tests)**:
  - `T2.12.1`: Registration with phone < 10 characters rejected.
  - `T2.12.2`: Registration with password < 6 characters rejected.
  - `T2.12.3`: Login with wrong password returns 401.
  - `T2.12.4`: Tampered or expired JWT token returns null session.
  - `T2.12.5`: Mock payment on non-existent orderId returns 404.

### 3.4 Tier 3: Cross-Feature Combinations (15 Tests)

- `T3.1`: **Owner Theme Switch -> Menu Token Reflection**: Owner updates theme from `NORDIC_MINIMAL` to `OLED_CARBON` via `/api/owner/cafe`; customer menu query immediately returns `themeId: OLED_CARBON` with dark palette tokens.
- `T3.2`: **Theme + Cart + Modifiers + Order Total**: Customer orders coffee with 2 modifiers under `WARM_TERRACOTTA`; cart computes total correctly and creates order with exact prices.
- `T3.3`: **Order Creation -> KDS Broadcast -> Item Progression -> Auto-Ready**: Order creation emits `NEW_ORDER` to KDS SSE; Barista updates items to `DONE`; order status automatically transitions to `READY` and emits `ORDER_READY`.
- `T3.4`: **Customer Order -> Loyalty Stamp Accumulation**: Customer places order; loyalty stamps count increases; customer loyalty card displays updated illuminated stamp.
- `T3.5`: **Multiple Orders -> Reorder Count -> Haman Hamishegi Widget**: Multiple orders placed for specific item; reorderCount increments in database; item appears in top recommendations of "همان همیشگی" widget.
- `T3.6`: **Staff 86-Stock Depletion -> Customer Menu Disabling**: Staff toggles stock availability via `/api/stock`; item becomes unavailable; customer menu disables add-to-cart button.
- `T3.7`: **Table Service FAB -> KDS SSE Alert -> Staff Resolution**: Customer presses Table Service Hub button; `TABLE_SERVICE` event arrives on KDS stream; staff marks service request resolved.
- `T3.8`: **Cafe Registration -> Admin Approval -> Discovery Appearance**: Owner registers new cafe; cafe is initially unapproved and hidden from discovery; Admin approves cafe; cafe becomes visible in public marketplace.
- `T3.9`: **Upfront Payment Workflow -> Buzzer Assignment -> Payment Confirmation**: Customer checks out with `PAY_UPFRONT_BUZZER`; order receives random buzzer number; mock payment marks order `CONFIRMED` and `PAID`.
- `T3.10`: **Table Tab Split Workflow -> Direct Confirmation -> Table Service Bill Request**: Customer orders with `TABLE_TAB_SPLIT`; order created directly as `CONFIRMED`; customer calls for bill via Table Service Hub.
- `T3.11`: **Owner Menu CRUD -> 5-Axis Radar Data -> Menu Profile Display**: Owner creates specialty coffee with custom radar values; customer menu renders 5-axis SVG radar chart with exact coordinates.
- `T3.12`: **Discovery Geo-Search -> Navigation -> Theme Loading**: Customer queries discovery with lat/lng; Haversine distance sorts cafes; customer opens closest cafe with corresponding theme tokens.
- `T3.13`: **Admin Cafe Deactivation -> Customer Menu 404 -> KDS Stream Disconnect**: Admin deactivates cafe (`isActive: false`); customer menu returns 404; KDS stream rejects unauthorized connection.
- `T3.14`: **Station Filter Isolation in KDS**: Staff assigned to `HOT_BAR` filters KDS view; only hot bar items visible while cold bar and pastry items are isolated.
- `T3.15`: **Complex Multi-Item Cart with Discounted Prices & Multi-Select Modifiers**: Customer builds cart with normal items, discounted items, and multi-modifiers; verified order totals and database item breakdown match exactly.

### 3.5 Tier 4: Real-World Workload Scenarios (6 Scenarios)

- **Scenario 1: Complete Specialty Cafe Dine-In Workflow**
  - Discovery search -> Select "روستری کالکتیو" -> Theme tokens load (`NORDIC_MINIMAL`) -> View coffee flavor radar -> Open customization drawer -> Add double shot espresso with oat milk -> Add croissant -> Checkout upfront -> Mock payment completes -> Buzzer 23 issued -> KDS receives order -> Barista finishes hot bar & pastry -> Order ready alert.
- **Scenario 2: High-Volume Morning Rush Simulation**
  - 5 simultaneous orders from different tables placed concurrently -> KDS dispatch across HOT_BAR, COLD_BAR, and PASTRY -> Baristas process items in parallel -> SLA timer warnings monitored -> All orders marked READY under load.
- **Scenario 3: Digital Loyalty Lifecycle & Favorite Reorder**
  - Customer with 5 stamps visits cafe -> Opens "همان همیشگی" widget -> 1-click adds usual Flat White -> Completes order -> 6th stamp awarded (stamp card full) -> Free drink qualification recorded.
- **Scenario 4: Table Service Assistance & Split Bill Dining Experience**
  - Group seated at Table 4 -> Customer calls waiter via FAB -> Staff acknowledges service call -> Group places multiple item orders on Table Tab -> Customer requests POS terminal via FAB -> Staff resolves terminal request -> Bill settlement simulated.
- **Scenario 5: Multi-Theme Cafe Onboarding & Admin Approval Flow**
  - New cafe owner registers -> Sets up "کافه آرت ژورنال" with `NEO_EDITORIAL` theme -> Configures categories & items -> Super Admin logs in -> Approves cafe -> Cafe appears in public Discovery marketplace with accurate distance and theme badge.
- **Scenario 6: 86-Stock Depletion & Barista Live Intervention**
  - Cold brew inventory runs out -> Barista 86's Cold Brew via `/api/stock` -> Live SSE stream broadcasts `ITEM_86ED` -> Customer menu reflects unavailable status -> Customer prevented from adding to cart -> Barista brews fresh batch and toggles stock back to available -> Item restored in customer menu.

---

## 4. Verification Method

### 4.1 Execution Commands
Once implemented, the entire 4-tier test framework can be executed via:

```bash
# Run the complete test suite (all 4 tiers, 141 tests)
npx tsx tests/runner.ts

# Run specific tier
npx tsx tests/runner.ts --tier=1
npx tsx tests/runner.ts --tier=2
npx tsx tests/runner.ts --tier=3
npx tsx tests/runner.ts --tier=4

# Filter by feature
npx tsx tests/runner.ts --feature=5

# Filter by search string
npx tsx tests/runner.ts --grep="Radar"

# TypeScript validation pass
npx tsc --noEmit
```

### 4.2 Invalidation Conditions
- Any test assertion failure (e.g. status code mismatch, token omission, arithmetic discrepancy).
- Test execution failing to complete with exit code 0.
- Total test count dropping below 140 tests.
- TypeScript compiler errors in test files or source code.

---

## 5. Conclusion
The CafeChi platform is fully surveyed across all 12 key features, database models, and API route handlers. Running tests via `npx tsx tests/runner.ts` using in-process Next.js Route handler invocation provides high execution speed, zero external dependencies, and complete test isolation. The proposed 4-tier testing blueprint includes 141 comprehensive tests (Tier 1: 60, Tier 2: 60, Tier 3: 15, Tier 4: 6) with complete coverage across all features, boundaries, cross-cutting interactions, and real-world workflows.
