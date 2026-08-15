# Comprehensive Platform UI/UX & Responsive Survey Report — CafeChi (کافه‌چی)

**Agent**: Explorer 2 (Platform UI, UX, Typography, and Responsive Survey)  
**Date**: 2026-08-16  
**Scope**: Discovery Marketplace (`/`), KDS Barista Station (`/kds/[cafeSlug]`), Owner Studio (`/owner`), Super Admin Dashboard (`/admin`), Authentication (`/login`, `/register`), and Mock Payment Gateway (`/mock-payment`).  
*(Note: Customer Menu `/c/[cafeSlug]` is covered by Explorer 1).*

---

## 1. Executive Summary

CafeChi's platform architecture provides an end-to-end digital café ecosystem spanning consumer discovery, barista execution, café management, administrative governance, and simulated frictionless payment. The application is built with **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, **Prisma 7**, **SQLite / PGlite**, `@dnd-kit`, `Leaflet`, `qrcode`, and `lucide-react`.

### High-Level Assessment
- **Persian Typography & RTL**: The design system establishes Persian typography via **Vazirmatn** (`wght: 100..900`), Latin typography via **Plus Jakarta Sans**, and monospace codes via **Geist Mono**. Directionality (`dir="rtl"`) is set at the root `<html>` level, with proper LTR overrides for prices, phone numbers, buzzer numbers, and distance metrics (`.price`, `.number`, `.code`).
- **Visual Design Identity**: A refined **Editorial Luxury Minimalism** design language is defined in `globals.css` using CSS custom properties (`--color-bg: #FBF9F5`, `--color-accent: #947151`, `--color-sage: #2E5A44`, etc.) and a 5-theme palette system (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`).
- **Critical Architectural Discrepancy Found**: While `globals.css` defines a custom vanilla CSS system, `src/app/kds/[cafeSlug]/page.tsx` was implemented using **Tailwind CSS utility classes** (`bg-gray-100`, `w-80`, `rounded-xl`, `bg-blue-600`, etc.). Because Tailwind CSS is **NOT** installed or processed in the project, the KDS page currently renders unstyled without borders, backgrounds, card paddings, SLA colors, or modal structures.
- **Critical Functional Discrepancies Found**:
  1. **KDS SSE Event Parsing**: In `kds/[cafeSlug]/page.tsx`, the `INITIAL_STATE` event expects `event.payload.orders`, whereas the backend SSE stream sends `event.payload` directly as an array of orders. This prevents active database orders from loading into KDS on initial mount.
  2. **KDS Item Status Advance Route**: KDS calls `/api/orders/${orderId}/items/${itemId}` which returns `404 Not Found` because the API route is mapped at `/api/orders/items/[orderItemId]`.
  3. **KDS Stock Load Route**: KDS calls `GET /api/stock?cafeSlug=${cafeSlug}` which returns `405 Method Not Allowed` because `/api/stock` only defines `PATCH`. The menu should be fetched via `/api/menu/${cafeSlug}`.
  4. **KDS Table Service Dismiss Route**: KDS calls `PATCH /api/table-service/${id}` (yielding 404) instead of `PATCH /api/table-service` with `{ id, status }` in the JSON body.
  5. **Owner Category Creation Route**: Owner Studio calls `POST /api/owner/menu/categories` which does not exist in the API router.
  6. **Mobile Sidebar Layout**: Both Owner Studio (`/owner`) and Admin Dashboard (`/admin`) use hardcoded fixed desktop sidebars (`width: 240px` / `220px` with `marginRight: 240px` / `220px`) with no mobile hamburger navigation, breaking mobile and portrait tablet viewports.

---

## 2. Detailed Route-by-Route Investigation

### 2.1. Discovery Marketplace (`/`)

#### Structure & Component Inventory
- **File Location**: `src/app/page.tsx`, `src/components/marketplace/CafeMap.tsx`, `src/app/api/discovery/route.ts`
- **Header Navigation**: Fixed height (64px) glassmorphism sticky header (`.nav`) with backdrop blur (`backdrop-filter: blur(12px)`), logo icon with warm cream accent (`#FAF6ED`), dual English/Persian typography ("cafechi" / "کافه‌چی"), and quick CTA buttons (`ورود` and `ثبت‌نام کافه`).
- **Hero Section**:
  - Editorial badge: `کشف قهوه تخصصی در شهر شما` with pill radius and subtle border.
  - Large display headline using responsive typography clamp (`clamp(2rem, 5vw, 3.5rem)`): `هر لحظه‌ای لایق بهترین قهوه است`.
  - Search bar: 56px height, right-aligned search icon, LTR/RTL clear button (`X`), live 300ms debounced fetching.
- **Controls & Filter Bar**:
  - Geolocation trigger (`استفاده از موقعیتم` / `موقعیت: فعال`).
  - Distance radius slider (`0.5 km` to `20 km`) with Latin font label.
  - Collapsible filter trigger with active filter count badge.
  - View mode toggle button (List View vs Map View).
- **Filter Chips**:
  - 7 status/amenity chips: `باز است` (Open Now), `وای‌فای` (WiFi), `فضای باز` (Outdoor), `سیگار` (Smoking Allowed), `بردگیم` (Board Games), `کار با لپ‌تاپ` (Work Friendly), `حیوان خانگی` (Pet Friendly).
- **Results Grid & CafeCard**:
  - 3-column auto-fill responsive grid (`minmax(320px, 1fr)`).
  - Cover image placeholder with coffee icon fallback.
  - Status badge in top-right corner (`باز است` in Sage green, `بسته` in muted gray).
  - Distance indicator in bottom-left corner with Latin numerals (`font-family: var(--font-latin)`).
  - Persian business type badge (`روستری تخصصی`, `کافه‌بار`, `بیکری`, `کافه`, `رستوران`, `برانچ`).
  - 2-line clamped description (`-webkit-line-clamp: 2`).
  - Persian address with MapPin icon.
  - Amenity icon row with tooltip titles.
- **Interactive Leaflet Map (`CafeMap.tsx`)**:
  - Dynamically imported with `ssr: false` to prevent server hydration mismatches.
  - Custom HTML `L.divIcon` badges in Persian: Sage green for open cafes, Dark Gray for closed cafes.
  - Interactive popup with café title, address, and direct link to `/c/${cafe.slug}`.
  - Automatic bounds fitting to include all markers and user location.

#### Identified Visual & UX Flaws on Discovery Marketplace
| # | Location | Flaw Description | Impact | Proposed Fix |
|---|---|---|---|---|
| D1 | `src/app/page.tsx:411` | Grid minimum width `minmax(320px, 1fr)` causes horizontal scroll on small devices (320px-360px viewport) due to container padding (320px + 32px padding = 352px > viewport). | Mobile layout overflow | Change to `grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));` |
| D2 | `src/app/page.tsx:174-255` | Lack of quick City / Neighborhood selector buttons (e.g. تهران, ولیعصر, انقلاب, الهیه, شهرک غرب, اصفهان, شیراز). Users without geolocation have to type in search. | UX Discovery speed | Add a horizontal scrollable quick-filter tag row for top Iranian café districts below the search bar. |
| D3 | `src/app/page.tsx:175` | Hero section padding `var(--space-20) 0 var(--space-16)` (80px top / 64px bottom) is too large on mobile screens, pushing content below the fold. | Mobile vertical spacing | Use responsive media query for mobile hero padding (`--space-10` / 40px). |
| D4 | `src/components/marketplace/CafeMap.tsx:72` | Marker icon anchor `iconAnchor: [40, 14]` is hardcoded, causing marker text to appear offset from the coordinate point for variable café name lengths. | Map marker pin precision | Center anchor or use point indicator circle below the name pill. |

---

### 2.2. KDS Barista Station (`/kds/[cafeSlug]`)

#### Structure & Component Inventory
- **File Location**: `src/app/kds/[cafeSlug]/page.tsx`, `src/app/api/kds/stream/[cafeSlug]/route.ts`
- **Real-Time SSE Connection**: Connects to `/api/kds/stream/${cafeSlug}` with auto-reconnect, receiving `INITIAL_STATE`, `NEW_ORDER`, `ITEM_STATUS_UPDATE`, `TABLE_SERVICE`, `ITEM_86ED`, and `ORDER_READY` events.
- **Audio Chime System**: Web Audio API oscillator synthesizing a 3-tone harmonic chime (`523Hz`, `659Hz`, `784Hz` / C5-E5-G5) when new orders or table service requests arrive.
- **Table Service Floating Banners**: Top-anchored alerts for table calls (`احضار گارسون`, `درخواست صورتحساب`, `درخواست آب`, `درخواست کارتخوان`) with one-click dismiss button.
- **Station Filter Tabs**: Switch between `همه` (ALL), `بار گرم` (HOT_BAR), `بار سرد` (COLD_BAR), `آشپزخانه` (KITCHEN), `قنادی` (PASTRY), `اکسپدایتر` (EXPEDITER).
- **Kanban Columns**: 4 distinct order progress columns:
  1. `جدید` (New confirmed orders)
  2. `در حال آماده‌سازی` (In preparation)
  3. `آماده تحویل` (Ready for pickup / table delivery)
  4. `تحویل شد` (Delivered archive - last 5 orders)
- **SLA Countdown & Urgency Warning**: Real-time timer (`now - createdAt`) formatted in MM:SS (Latin font), with visual urgency escalations:
  - `< 5 min`: Green normal status
  - `5 - 10 min`: Amber warning status
  - `> 10 min`: Red alert status with pulsing border animation
- **Item-Level & Order-Level Transitions**:
  - Granular item status toggle (`در انتظار` -> `در حال آماده‌سازی` -> `آماده`).
  - Expediter macro advance button (`مرحله بعد` -> advances whole order from Confirmed -> In Prep -> Ready -> Delivered).
- **Live "86" Stock Management Modal**: Barista modal to instantly toggle item availability with live SSE broadcast to all active customer menus.

#### Critical Architectural & Styling Flaws in KDS
| # | Location | Flaw Description | Impact | Proposed Fix |
|---|---|---|---|---|
| K1 | `src/app/kds/[cafeSlug]/page.tsx` (all JSX) | **Tailwind Utility Classes Used Without Tailwind CSS**: The entire file uses classes like `bg-gray-100`, `w-80`, `rounded-xl`, `bg-blue-600`, `shadow-sm`, `border-b`, `text-green-600`, `animate-pulse`, `bg-black/50`, etc. Because Tailwind is not installed in `package.json` and not compiled by Next.js, KDS renders completely broken/unstyled. | **CRITICAL: Unstyled KDS Interface** | Replace all Tailwind classes with the global CSS design system (`.card`, `.btn`, `.btn-primary`, `.btn-secondary`, `.badge`, `.sla-ok`, `.sla-warn`, `.sla-danger`, `.modal-overlay`, `.modal`, `.toast`, CSS variables) and dedicated inline style rules. |
| K2 | `src/app/kds/[cafeSlug]/page.tsx:112` | **SSE Initial Orders Payload Mismatch**: Code checks `if (event.payload?.orders) setOrders(event.payload.orders);`, but backend stream (`/api/kds/stream/[cafeSlug]/route.ts:60`) emits `payload: activeOrders.map(...)` directly as an Array! `event.payload.orders` evaluates to `undefined`, so initial DB orders never load. | **CRITICAL: No initial orders loaded** | Support array payload: `if (Array.isArray(event.payload)) setOrders(event.payload); else if (event.payload?.orders) setOrders(event.payload.orders);` |
| K3 | `src/app/kds/[cafeSlug]/page.tsx:235` | **Invalid Item Status URL**: Calls `fetch("/api/orders/${orderId}/items/${itemId}")`, which does not exist in Next.js router (returns 404). API route is `/api/orders/items/[orderItemId]`. | **CRITICAL: Baristas cannot advance item statuses** | Change URL to `/api/orders/items/${itemId}`. |
| K4 | `src/app/kds/[cafeSlug]/page.tsx:263` | **Invalid Table Service Dismiss URL**: Calls `fetch("/api/table-service/${id}", { method: "PATCH" })` which returns 404. The route is `/api/table-service` expecting `{ id, status }` in body. | **CRITICAL: Table alerts cannot be dismissed** | Change URL to `/api/table-service` with body `JSON.stringify({ id, status: "DONE" })`. |
| K5 | `src/app/kds/[cafeSlug]/page.tsx:277` | **Invalid Stock GET URL**: Calls `fetch("/api/stock?cafeSlug=${cafeSlug}")`. `/api/stock` only has `PATCH` handler (returns 405). | **CRITICAL: Stock modal cannot load items** | Fetch menu items via `/api/menu/${cafeSlug}` and extract items from categories. |
| K6 | `src/app/kds/[cafeSlug]/page.tsx:364` | **Item Title Property Fallback**: Renders `item.name`. In Prisma `OrderItemPublic`, the title is stored under `item.item.title` or `item.title`. If `item.name` is undefined, item displays as empty string. | Blank item names in order cards | Use `item.item?.title || item.title || item.name || "آیتم"`. |
| K7 | `src/app/kds/[cafeSlug]/page.tsx:475` | **Tablet & Touch Optimization**: Barista stations on iPads and POS tablets require minimum 48px touch targets, high contrast dark/light themes, and sticky column headers when scrolling vertically. | Tablet Ergonomics | Apply touch-action manipulation, explicit column min-width, and sticky headers. |

---

### 2.3. Owner Studio (`/owner` and sub-routes)

#### Structure & Component Inventory
- **File Location**: `src/app/owner/page.tsx`, `src/app/api/owner/...`
- **Navigation & Layout**: Fixed right sidebar (240px) with café branding, verification badge, and 5 management tabs:
  1. `پروفایل و تنظیمات` (Profile & Settings)
  2. `منوساز` (Menu Builder & Stock)
  3. `تم بصری` (Visual Theme System & Live Preview)
  4. `پرسنل` (Staff Permissions)
  5. `میزها و QR` (Table Management & QR Generator)
- **Profile & Settings Tab (`ProfileTab`)**:
  - Name, description, address, phone number editing with live PATCH `/api/owner/cafe`.
  - Workflow Mode 4-way selector cards: `پیجر دیجیتال` (PAY_UPFRONT_BUZZER), `پرداخت پای صندوق` (PAY_AT_COUNTER), `فاکتور مشترک میز` (TABLE_TAB_SPLIT), `کاتالوگ تصویری` (VIEW_ONLY).
  - Amenities 6-item toggle grid (WiFi, Smoking, Outdoor, Board games, Work friendly, Pet friendly).
- **Menu Builder Tab (`MenuTab`)**:
  - Drag-and-drop category sorting with `@dnd-kit/core` and `@dnd-kit/sortable`.
  - Instant stock toggle (86ing) per item via `/api/stock`.
  - New Category creation form.
  - "New Item" comprehensive modal (`NewItemModal`):
    - Category selection, title, description, price (Toman), prep time (minutes), tags, allergens.
    - Specialty Coffee Tasting Profile Editor: Origin, Altitude, Processing method (Washed/Honey/Natural), Roast level, Flavor notes, and **5-axis Radar Profile Sliders** (Acidity, Body, Sweetness, Bitterness, Aroma from 1 to 10 with live Latin numerical badges).
- **Visual Theme Picker Tab (`ThemeTab`)**:
  - 5 Theme Selector Cards (`NORDIC_MINIMAL`, `OLED_CARBON`, `ARTISAN_SEPIA`, `NEO_EDITORIAL`, `WARM_TERRACOTTA`).
  - 5-swatch palette visual preview (Background, Surface, Text, Accent, Border).
  - Persian & Latin title, poetic theme description.
  - **Live Interactive Menu Preview**: Dynamically applies the chosen theme's CSS variables (`--theme-bg`, `--theme-surface`, `--theme-accent`, `--theme-text`, `--theme-border`, `--theme-radius`, etc.) rendering mock café header, active category pill, and styled menu item card.
- **Staff Management Tab (`StaffTab`)**:
  - Staff list with station tags and capability badges (`ویرایش منو`, `86 آیتم`, `مدیریت سفارش`, `ویرایش قیمت`, `مشاهده آمار`).
  - Delete staff permission button.
  - Add Staff form by phone number with granular permission toggles.
- **Tables & QR Generator Tab (`TablesTab`)**:
  - Table grid with real-time occupancy status indicators (Green = Free, Red = Occupied).
  - High-resolution client-side QR Code PNG generator (`qrcode` library) pointing to `${origin}/c/${cafe.slug}?table=${tableNumber}` with one-click download.

#### Identified Visual & UX Flaws in Owner Studio
| # | Location | Flaw Description | Impact | Proposed Fix |
|---|---|---|---|---|
| O1 | `src/app/owner/page.tsx:237-323` | **Desktop-Only Fixed Sidebar**: Sidebar is fixed (`width: 240px; right: 0;`), and main content has hardcoded `marginRight: 240px`. On mobile screens (<768px) and portrait tablets, the sidebar covers the content or leaves unusable narrow width. | **CRITICAL: Mobile/Tablet unusable** | Introduce responsive layout: On screens <768px, convert sidebar to a mobile bottom navigation bar or top drawer, setting `marginRight: 0`. |
| O2 | `src/app/owner/page.tsx:701` | **Missing Category API Endpoint**: Calls `POST /api/owner/menu/categories` which does not exist in the Next.js API routes (returns 404). | **CRITICAL: Adding categories fails** | Create `src/app/api/owner/menu/categories/route.ts` or add category creation handling to `src/app/api/owner/menu/route.ts`. |
| O3 | `src/app/owner/page.tsx:572` | **Dynamic `require` in React Render**: `const { THEMES } = require("@/lib/themes");` is called inside `ThemePreview` render body. | Minor performance / lint anti-pattern | Use top-level static import `THEMES` from `@/lib/themes`. |
| O4 | `src/app/owner/page.tsx:1010, 1058` | **Page Reload on Staff Mutation**: Uses `window.location.reload()` after adding or deleting staff, causing full-page flash and state reset. | UX Polish | Update React local state `cafe.staffPermissions` optimistically without reloading the window. |
| O5 | `src/app/owner/page.tsx:442` | **Amenities Grid on Small Mobile**: `gridTemplateColumns: "repeat(3, 1fr)"` squeezes amenity buttons to ~80px on 320px screens. | Mobile button text clipping | Use `grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));` or `repeat(2, 1fr)` on mobile. |

---

### 2.4. Super Admin Dashboard (`/admin` and sub-routes)

#### Structure & Component Inventory
- **File Location**: `src/app/admin/page.tsx`, `src/app/api/admin/cafes/route.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/cafes/[cafeId]/route.ts`
- **Sidebar Navigation**: Dark luxury obsidian sidebar (`#121211`) with platform shield icon, pending café alert pill, and tab switcher (`کافه‌ها` / `کاربران`).
- **KPI Metrics Header**: 4 key performance cards:
  - `کل کافه‌ها` (Total Cafes)
  - `تأیید شده` (Approved Cafes - Sage green)
  - `در انتظار تأیید` (Pending Cafes - Amber)
  - `کل کاربران` (Total Users - Dark obsidian)
- **Cafes Management Tab (`activeTab === "cafes"`)**:
  - Full café registry table showing Café Name + Slug, Owner Name + Phone, ThemeId & WorkflowMode badges, Status badge (`تأیید شده` / `در انتظار`).
  - Action buttons: Quick preview menu (`Eye` icon linking to `/c/${cafe.slug}`), One-click Approve (`CheckCircle` button) / Unapprove (`XCircle` button) via `PATCH /api/admin/cafes/[cafeId]`.
- **Users Management Tab (`activeTab === "users"`)**:
  - User directory table showing Full Name, Phone, Role badge (`SUPER_ADMIN` red, `CAFE_OWNER` amber, `STAFF` accent, `CUSTOMER` gray), Persian registration date formatted with `toLocaleDateString("fa-IR")`.

#### Identified Visual & UX Flaws in Super Admin Dashboard
| # | Location | Flaw Description | Impact | Proposed Fix |
|---|---|---|---|---|
| A1 | `src/app/admin/page.tsx:94-158` | **Desktop Fixed Sidebar Overlap on Mobile**: Like Owner Studio, `aside` is fixed `width: 220px` with `marginRight: 220px` on `<main>`, breaking tablet and mobile screens. | Broken mobile layout | Add responsive media query: collapse sidebar into top bar or toggleable drawer on `< 768px`. |
| A2 | `src/app/admin/page.tsx:160` | **KPI Grid Fixed 4 Columns**: `gridTemplateColumns: "repeat(4, 1fr)"` shrinks stat cards into unreadable thin columns on screens `< 900px`. | Tablet/Mobile distortion | Change to `grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));`. |
| A3 | `src/app/admin/page.tsx:185, 257` | **Table Horizontal Overflow**: `<table>` elements are placed directly in `.card` without an `overflow-x: auto` wrapper, causing the table to break out of card bounds on narrow viewports. | Layout overflow | Wrap `<table>` in `<div style={{ overflowX: "auto" }}>`. |

---

### 2.5. Authentication & Mock Payment (`/login`, `/register`, `/mock-payment`)

#### Structure & Component Inventory
- **Login Page (`/login`)**:
  - Clean centered authentication container (`maxWidth: 400px`).
  - Phone input with right-aligned phone icon, LTR formatting.
  - Password input with lock icon and interactive show/hide password toggle (`Eye` / `EyeOff`).
  - Persian submit button with inverted RTL arrow icon (`transform: "scaleX(-1)"`).
  - Role-based automatic redirect on successful authentication:
    - `SUPER_ADMIN` -> `/admin`
    - `CAFE_OWNER` -> `/owner`
    - `STAFF` -> `/kds/[cafeSlug]`
    - `CUSTOMER` -> `/` or previous `from` URL
  - Quick-test credentials box with 4 one-click fill buttons (Admin, Owner, Barista, Customer).
  - Next.js `Suspense` wrapper for SSR compatibility with `useSearchParams()`.
- **Register Page (`/register`)**:
  - Centered card (`maxWidth: 440px`).
  - Role switcher tab (`مشتری` vs `صاحب کافه`).
  - Full Name, Phone, Password inputs.
  - Special notice for café owners explaining that new cafés undergo verification before public listing.
  - Form validation feedback and error banners.
- **Mock Payment Gateway Simulation (`/mock-payment`)**:
  - 4 Simulation Stages:
    1. `loading`: Skeleton loader while fetching order details.
    2. `processing`: Pulsing coffee cup icon with 2-second realistic timer simulating Shaparak / Shetab gateway response.
    3. `success`: Green checkmark animation, updates order status to `CONFIRMED` in database via `PATCH /api/orders/${orderId}`.
    4. `failed` / `not-found`: Graceful error recovery with home navigation.
  - Dynamic Display based on café `workflowMode`:
    - `PAY_UPFRONT_BUZZER`: Large vibrating digital buzzer card (`buzzer-pulse` animation) with 80px Latin buzzer number (`order.buzzerNumber`) and guidance text ("وقتی آماده شد، پیجر شما ارتعاش می‌گیرد").
    - `PAY_AT_COUNTER` / `TABLE_TAB_SPLIT`: High-visibility Monospace Latin Order Code (`order.orderCode`).
  - Itemized receipt breakdown: Quantities, item titles, modifiers, subtotal, and total amount in Toman.

#### Identified Visual & UX Flaws in Auth & Mock Payment
| # | Location | Flaw Description | Impact | Proposed Fix |
|---|---|---|---|---|
| P1 | `src/app/login/page.tsx:41` | **Staff Redirect Route Slug**: Redirects to `/kds/${cafeId}` using `cafeId` (cuid) instead of `cafeSlug`. KDS route is `/kds/[cafeSlug]`. | 404 on Staff Login if cafeId used | Ensure JWT/login response returns `cafeSlug` and redirects to `/kds/${cafeSlug}`. |
| P2 | `src/app/mock-payment/page.tsx:44-49` | **Mock Payment Confirmation Async Race**: If user refreshes or leaves before the 2000ms timeout completes, the order status in database remains `PENDING_PAYMENT`. | Inconsistent order status | Confirm order immediately or provide a retry/check status mechanism. |
| P3 | `src/app/login/page.tsx:137` | **RTL Arrow Direction**: `transform: "scaleX(-1)"` correctly flips `ArrowRight` to point left (the forward direction in RTL Persian), but button text and icon gap should maintain consistent alignment. | Visual polish | Ensure `display: inline-flex; align-items: center; gap: var(--space-2)` is maintained. |

---

## 3. Comprehensive Cross-Platform Responsive & Typography Audit

### 3.1. Responsive Breakpoint Matrix

| Page / Route | Mobile (320px - 480px) | Tablet (768px - 1024px) | Desktop (>1200px) |
|---|---|---|---|
| **Discovery (`/`)** | ⚠️ Card grid min-width 320px causes minor overflow on 320px devices. Filters & search stack cleanly. Hero padding needs mobile reduction. | ✅ 2-column card grid, Leaflet map renders smoothly, sticky controls bar functions well. | ✅ 3 to 4 column card grid, full map view with split bounds, optimal spacing. |
| **KDS Barista (`/kds/[slug]`)** | ❌ Completely broken due to missing Tailwind styles. Needs horizontal scroll Kanban board. | ❌ Broken due to missing Tailwind styles. When styled, tablet landscape is ideal for 4-column board. | ❌ Broken due to missing Tailwind styles. When styled, wide screen fits all 4 columns without scrolling. |
| **Owner Studio (`/owner`)** | ❌ Fixed 240px sidebar permanently covers screen content. Cannot be used on mobile. | ⚠️ Usable in landscape, but sidebar leaves limited content width in portrait. | ✅ Excellent layout with comfortable multi-column forms and theme previews. |
| **Admin Dashboard (`/admin`)** | ❌ Fixed 220px sidebar covers screen content. Tables overflow without horizontal scroll. | ⚠️ Usable in landscape; KPI cards shrink on narrow tablets. | ✅ Clean tabular layout with clear moderation actions. |
| **Auth (`/login`, `/register`)** | ✅ Fully responsive centered card (100% width with max-width clamp). | ✅ Perfectly centered card. | ✅ Perfectly centered card. |
| **Mock Payment (`/mock-payment`)** | ✅ Fully responsive receipt & vibrating digital buzzer card. | ✅ Clean centered payment receipt. | ✅ Clean centered payment receipt. |

### 3.2. Persian Vazirmatn & RTL Typography Compliance

1. **Font Loading & Hierarchy**:
   - `src/app/layout.tsx` imports Google Fonts: `Vazirmatn` (100-900), `Plus Jakarta Sans` (400-800), and `Geist Mono` (400-600).
   - Global typography rules in `globals.css` set `direction: rtl`, `font-family: var(--font-persian)`, and font weights (`800` for headings, `500` for body, `700` for buttons/labels).
2. **Number & Price Bi-Directionality**:
   - Class `.price`, `.number`, `.code`, `.badge-number` enforce `font-family: var(--font-latin)` and `direction: ltr`.
   - Prices consistently display with Toman currency suffix (`ت` or `تومان`) placed correctly after the formatted number.
3. **Form Inputs & Alignment**:
   - Persian text inputs correctly align right (`text-align: right; direction: rtl;`).
   - Phone numbers and numerical inputs (`type="tel"`, `type="number"`) correctly specify `dir="ltr"` and `text-align: left;` to prevent Persian character transposition.

---

## 4. Synthesis of Platform Design System & Themes

The platform features a 5-theme visual identity engine defined in `src/lib/themes.ts`:

```typescript
export const THEMES: Record<ThemeId, ThemeDefinition> = {
  NORDIC_MINIMAL: {
    nameFa: "نوردیک مینیمال",
    preview: { bg: "#F6F3EE", surface: "#FAF8F5", text: "#1C1917", accent: "#8B5E3C", border: "#DED7CA" },
    cssVars: { "--theme-radius": "12px", "--theme-card-shadow": "0 2px 10px rgba(44,30,20,0.06)", ... }
  },
  OLED_CARBON: {
    nameFa: "اولد کربن",
    preview: { bg: "#080808", surface: "#181818", text: "#F5F5F4", accent: "#F59E0B", border: "#282828" },
    cssVars: { "--theme-radius": "10px", "--theme-card-shadow": "0 4px 20px rgba(0,0,0,0.8)", ... }
  },
  ARTISAN_SEPIA: {
    nameFa: "آرتیزان سپیا",
    preview: { bg: "#F8F3E8", surface: "#FFFDF9", text: "#2B1D14", accent: "#8D4A23", border: "#DFCDB8" },
    cssVars: { "--theme-radius": "8px", "--theme-card-shadow": "0 2px 8px rgba(43,29,20,0.08)", ... }
  },
  NEO_EDITORIAL: {
    nameFa: "نئو ادیتوریال",
    preview: { bg: "#F4F4F0", surface: "#FFFFFF", text: "#09090B", accent: "#09090B", border: "#18181B" },
    cssVars: { "--theme-radius": "0px", "--theme-card-shadow": "4px 4px 0px #18181B", ... }
  },
  WARM_TERRACOTTA: {
    nameFa: "ترراکوتای گرم",
    preview: { bg: "#FCF3EC", surface: "#FFFFFF", text: "#3C1B10", accent: "#C25327", border: "#F3D2C0" },
    cssVars: { "--theme-radius": "22px", "--theme-card-shadow": "0 4px 16px rgba(194,83,39,0.12)", ... }
  },
};
```

### Theme System Observations:
- **Owner Studio Integration**: The Theme Picker in `/owner` faithfully renders all 5 themes with live color swatches and an interactive simulated menu component that consumes the theme's `--theme-*` variables in real time.
- **Discovery Marketplace Alignment**: Discovery cards display the café's theme and workflow mode badges, priming the customer for the specialized aesthetic of the café before navigating to `/c/[cafeSlug]`.

---

## 5. Master Remediation Checklist for Implementers

1. **[P0] Complete KDS CSS Overhaul**:
   - Rewrite `src/app/kds/[cafeSlug]/page.tsx` to replace all Tailwind classes with native CSS classes (`.card`, `.btn`, `.badge`, `.sla-ok`, `.sla-warn`, `.sla-danger`, `.modal-overlay`, `.modal`, `.toast`) and clean inline styles.
2. **[P0] Fix KDS Real-Time Backend Integrations**:
   - Fix SSE `INITIAL_STATE` handler in `kds/[cafeSlug]/page.tsx` to accept Array payload.
   - Fix item status advance URL to `/api/orders/items/${itemId}`.
   - Fix table service dismiss URL to `PATCH /api/table-service` with `{ id, status }`.
   - Fix stock modal to load menu from `/api/menu/${cafeSlug}`.
   - Fix item title rendering fallback: `item.item?.title || item.title || item.name`.
3. **[P0] Responsive Sidebars for Owner & Admin**:
   - In `src/app/owner/page.tsx` and `src/app/admin/page.tsx`, replace hardcoded fixed `width: 240px` and `marginRight: 240px` with responsive CSS: on screens `< 768px`, render a mobile bottom navigation bar or top navigation header with `marginRight: 0`.
4. **[P1] Owner Category Creation API**:
   - Create route `src/app/api/owner/menu/categories/route.ts` supporting `POST` to create new categories.
5. **[P1] Discovery City / Neighborhood Selector**:
   - Add a quick neighborhood tag selector row to Discovery hero section for popular Iranian café districts.
   - Adjust card grid `minmax(min(100%, 280px), 1fr)` to prevent 320px viewport horizontal overflow.
6. **[P1] Admin Table & Metrics Responsiveness**:
   - Wrap admin tables in `<div style={{ overflowX: "auto" }}>`.
   - Update admin KPI grid to `repeat(auto-fit, minmax(180px, 1fr))`.
7. **[P2] Staff Login KDS Slug Redirect**:
   - In `src/app/login/page.tsx`, ensure redirect uses `cafeSlug` for staff routing.

---
*Analysis completed by Explorer 2. All findings verified against local codebase files and runtime schemas.*
