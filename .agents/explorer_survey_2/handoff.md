# Handoff Report — Explorer 2: Platform Application Pages Survey

**Agent**: Explorer 2  
**Working Directory**: `c:\Users\User\Documents\cafechi\.agents\explorer_survey_2`  
**Date**: 2026-08-16  
**Type**: Hard Handoff (Task Complete)

---

## 1. Observation

### Exact File Paths & Code Locations

1. **KDS Styling Failure (Tailwind Classes without Tailwind CSS)**:
   - File: `src/app/kds/[cafeSlug]/page.tsx` lines 320-563.
   - Observations:
     - Line 413: `<div className="min-h-screen bg-gray-100 flex flex-col font-sans" dir="rtl">`
     - Line 449: `<header className="bg-white shadow-sm border-b px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4 z-30 relative">`
     - Line 477: `<div className="w-80 flex flex-col bg-gray-50 rounded-xl p-3 h-full">`
     - Line 401: `<button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2">`
   - File: `package.json` lines 16-53: No `tailwindcss`, `@tailwindcss/postcss`, or `postcss` configured as build dependencies.
   - File: `src/app/globals.css`: Contains custom vanilla CSS variables and class rules (`.btn`, `.card`, `.badge`, `.sla-ok`, `.sla-warn`, `.sla-danger`, `.modal-overlay`, `.toast-container`, `.toast`), but zero definitions for Tailwind utility classes like `bg-gray-100`, `w-80`, `rounded-xl`, `bg-blue-600`, `bg-black/50`, etc.

2. **KDS SSE Event Payload Shape Mismatch**:
   - File: `src/app/kds/[cafeSlug]/page.tsx` lines 111-115:
     ```typescript
     case 'INITIAL_STATE':
       if (event.payload?.orders) {
         setOrders(event.payload.orders);
       }
     ```
   - File: `src/app/api/kds/stream/[cafeSlug]/route.ts` lines 60-72:
     ```typescript
     const initialMsg = `data: ${JSON.stringify({
       type: "INITIAL_STATE",
       cafeId,
       payload: activeOrders.map((o) => ({ ... })),
     })}\n\n`;
     ```
   - Observation: Backend emits `payload: Array<Order>`. Frontend checks `event.payload?.orders`, which evaluates to `undefined`. Initial database orders fail to load.

3. **KDS Incorrect REST Endpoints**:
   - File: `src/app/kds/[cafeSlug]/page.tsx` line 235:
     `await fetch('/api/orders/${orderId}/items/${itemId}', ...)`
     Whereas `src/app/api/orders/items/[orderItemId]/route.ts` is mapped at `/api/orders/items/[orderItemId]`.
   - File: `src/app/kds/[cafeSlug]/page.tsx` line 263:
     `await fetch('/api/table-service/${id}', { method: 'PATCH' })`
     Whereas `src/app/api/table-service/route.ts` expects `PATCH /api/table-service` with `{ id, status }` in body.
   - File: `src/app/kds/[cafeSlug]/page.tsx` line 277:
     `await fetch('/api/stock?cafeSlug=${cafeSlug}')`
     Whereas `src/app/api/stock/route.ts` only exports `PATCH`. Menu items must be fetched from `/api/menu/${cafeSlug}`.

4. **Owner Studio Sidebar Responsiveness & Missing Category Route**:
   - File: `src/app/owner/page.tsx` lines 237-248:
     `<aside style={{ width: 240, position: "fixed", top: 0, right: 0, bottom: 0 ... }}>`
   - File: `src/app/owner/page.tsx` line 323:
     `<main style={{ flex: 1, marginRight: 240, padding: "var(--space-8)" }}>`
   - Observation: Hardcoded 240px fixed sidebar with hardcoded 240px right margin permanently covers screen space on mobile viewports (<768px).
   - File: `src/app/owner/page.tsx` line 701:
     `const res = await fetch("/api/owner/menu/categories", { method: "POST" ... });`
     No route exists at `src/app/api/owner/menu/categories/route.ts` (returns 404).

5. **Super Admin Dashboard Layout & Table Overflow**:
   - File: `src/app/admin/page.tsx` lines 94-103: Fixed sidebar `width: 220px` with `marginRight: 220px` on `<main>` breaks on mobile.
   - File: `src/app/admin/page.tsx` line 160: `gridTemplateColumns: "repeat(4, 1fr)"` with no responsive collapse.
   - File: `src/app/admin/page.tsx` lines 185, 257: `<table>` elements lack an `overflow-x: auto` wrapper.

6. **Discovery Marketplace Grid Breakpoint**:
   - File: `src/app/page.tsx` line 411:
     `gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))"`
     On 320px screens with container padding, this exceeds 100vw and causes horizontal scrolling.

7. **TypeScript Build Verification**:
   - Tool Command: `npx tsc --noEmit`
   - Result: Exit code 0 (all TypeScript types and imports are valid).

---

## 2. Logic Chain

1. **Premise 1**: The CafeChi codebase is designed around a unified global CSS design system located in `src/app/globals.css` with CSS custom variables (`--color-bg`, `--color-accent`, `--theme-*`) and custom utility classes.
2. **Premise 2**: `src/app/kds/[cafeSlug]/page.tsx` relies entirely on utility classes from Tailwind CSS (`bg-gray-100`, `w-80`, `rounded-xl`, `bg-blue-600`, `text-green-600`, `animate-pulse`, `bg-black/50`, etc.).
3. **Inference 1 (From Premise 1 & 2 + Observation 1)**: Because Tailwind is not installed or configured, the browser applies no styles to these classes. Consequently, the KDS page renders as an unstyled, borderless column list, breaking the barista UX.
4. **Inference 2 (From Observation 2 & 3)**: Discrepancies between the URL patterns and SSE payload shapes in the frontend KDS code versus the backend Next.js API routes will cause KDS to fail at runtime when loading initial orders, advancing item statuses, dismissing table service requests, and managing 86 stock.
5. **Inference 3 (From Observation 4 & 5)**: The fixed desktop sidebar structure (`aside` fixed at 240px / 220px with matching `marginRight`) used in Owner Studio and Admin Dashboard prevents usable mobile/tablet rendering without responsive CSS media queries or drawer/bottom-bar adaptations.
6. **Inference 4 (From Observation 6)**: The 320px `minmax` grid value on Discovery Marketplace is 20-40px too wide for smallest mobile screens with padding, leading to subtle horizontal overflow.

---

## 3. Caveats

- **Scope Boundary**: Customer menu (`/c/[cafeSlug]`) was excluded from this investigation as it is surveyed by Explorer 1.
- **Runtime SSE Verification**: While SSE structure, event types, and JSON shapes were statically verified and traced against `src/app/api/kds/stream/[cafeSlug]/route.ts`, live WebSocket/SSE streaming in active production environments depends on server runtime buffer settings (`X-Accel-Buffering: no` is correctly set in route).
- **External Map Tiles**: Leaflet OpenStreetMap tile loading requires active internet connectivity on client devices.

---

## 4. Conclusion

The platform routes (Discovery Marketplace, KDS Barista Station, Owner Studio, Admin Dashboard, Auth, and Mock Payment) provide a feature-rich, high-performance architecture with strong Persian Vazirmatn typographic foundations and an innovative 5-theme visual system.

However, **four primary categories of fixes are required** before release:
1. **KDS Styling Overhaul**: Migrate KDS from Tailwind classes to the project's native CSS design system and variables.
2. **KDS & Owner API Route Alignment**: Fix SSE `INITIAL_STATE` array parsing, correct item status URL (`/api/orders/items/[id]`), correct table service PATCH body, implement `/api/owner/menu/categories` route, and load stock via `/api/menu/[slug]`.
3. **Responsive Mobile Layouts**: Implement responsive sidebar collapsing/bottom-bars for Owner Studio (`/owner`) and Admin Dashboard (`/admin`).
4. **Discovery & Admin Grid Polish**: Adjust Discovery card grid to `minmax(min(100%, 280px), 1fr)` and add City/Neighborhood quick-filter chips; wrap Admin tables in `overflow-x: auto` containers.

---

## 5. Verification Method

To independently verify all observations and conclusions:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected Output*: Exit code 0.

2. **Verify Missing Tailwind CSS in Dependencies**:
   Inspect `package.json` to confirm absence of `tailwindcss`. Inspect `src/app/kds/[cafeSlug]/page.tsx` to view unstyled Tailwind class usage.

3. **Verify API Route Mismatches**:
   - Inspect `src/app/api/kds/stream/[cafeSlug]/route.ts:60-72` vs `src/app/kds/[cafeSlug]/page.tsx:112`.
   - Inspect `src/app/api/orders/items/[orderItemId]/route.ts` vs `src/app/kds/[cafeSlug]/page.tsx:235`.
   - Inspect `src/app/api/table-service/route.ts:118-138` vs `src/app/kds/[cafeSlug]/page.tsx:263`.
   - Inspect `src/app/api/stock/route.ts` vs `src/app/kds/[cafeSlug]/page.tsx:277`.

4. **Verify Fixed Sidebar Layout**:
   Inspect `src/app/owner/page.tsx:237, 323` and `src/app/admin/page.tsx:95, 158` to verify hardcoded `position: fixed; width: 240px; marginRight: 240px`.

---
*Report written and saved to `c:\Users\User\Documents\cafechi\.agents\explorer_survey_2\handoff.md`.*
