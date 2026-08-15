## 2026-08-15T21:16:47Z
You are Explorer 2 for Milestone 1: 5-Theme Design System & Customer Menu Theme Fidelity.
Your working directory is: c:\Users\User\Documents\cafechi\.agents\explorer_m1_2
Mandatory reading:
- c:\Users\User\Documents\cafechi\.agents\ORIGINAL_REQUEST.md
- c:\Users\User\Documents\cafechi\PROJECT.md
- c:\Users\User\Documents\cafechi\.agents\sub_orch_m1\SCOPE.md

Task:
1. Thoroughly examine `src/app/c/[cafeSlug]/page.tsx` and `src/app/globals.css`.
2. Inspect every customer menu widget and component:
   - "همان همیشگی" (Haman Hamishegi) hero banner & quick cards
   - Loyalty stamp card (6 slots, active stamps illuminated with theme accent)
   - 5-axis dynamic SVG coffee flavor radar chart
   - Category scroll spy tabs & sticky headers
   - Menu item cards & hover states
   - Item detail bottom drawer sheet with modifiers & quantity
   - Floating cart bar & bottom drawer
   - Table service hub & FAB (QR table badge, waiter call, bill, POS, water)
3. Scan for all hardcoded colors (e.g. `#FEF3C7`, `#FFF`, `#FFFFFF`, `#D1FAE5`, `#EF4444`, `bg-white`, `text-black`, `border-gray-200`, etc.) that leak across themes.
4. Specify how each component must bind to CSS variables or dynamic theme utility classes to guarantee 0 color leaks across all 5 themes (especially dark OLED_CARBON vs light NORDIC_MINIMAL vs high-contrast NEO_EDITORIAL).
5. Write a comprehensive analysis report in `c:\Users\User\Documents\cafechi\.agents\explorer_m1_2\analysis.md` and handoff report in `c:\Users\User\Documents\cafechi\.agents\explorer_m1_2\handoff.md`.
6. Send a completion message back to your caller.
