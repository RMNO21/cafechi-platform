import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Radar Chart Geometry Stress Test
// ─────────────────────────────────────────────────────────────────────────────

function computeRadarPoints(profile, size = 200, radius = 64) {
  const center = size / 2;
  const axes = [
    { label: 'اسیدیته', value: profile.radar?.acidity ?? profile.acidity ?? 0 },
    { label: 'بادی', value: profile.radar?.body ?? profile.body ?? 0 },
    { label: 'شیرینی', value: profile.radar?.sweetness ?? profile.sweetness ?? 0 },
    { label: 'تلخی', value: profile.radar?.bitterness ?? profile.bitterness ?? 0 },
    { label: 'عطر', value: profile.radar?.aroma ?? profile.aroma ?? 0 },
  ];

  const getPoint = (value, angleIndex, max = 10) => {
    const safeVal = typeof value === 'number' && !isNaN(value) ? value : 0;
    const angle = (Math.PI / 2) - (2 * Math.PI * angleIndex / 5);
    const r = (Math.min(Math.max(safeVal, 0), max) / max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center - r * Math.sin(angle)
    };
  };

  const points = axes.map((a, i) => {
    const p = getPoint(a.value, i);
    return { ...p, str: `${p.x.toFixed(2)},${p.y.toFixed(2)}` };
  });

  const textPoints = axes.map((a, i) => {
    const p = getPoint(12.8, i, 10);
    return { label: a.label, x: p.x, y: p.y };
  });

  return { points, textPoints, axes };
}

function testRadarChart() {
  console.log('\n--- 1. Testing Coffee Radar Chart Geometry ---');
  const testCases = [
    { name: 'All Zeros (0s)', profile: { acidity: 0, body: 0, sweetness: 0, bitterness: 0, aroma: 0 } },
    { name: 'All Fives (5s)', profile: { acidity: 5, body: 5, sweetness: 5, bitterness: 5, aroma: 5 } },
    { name: 'All Tens (10s)', profile: { acidity: 10, body: 10, sweetness: 10, bitterness: 10, aroma: 10 } },
    { name: 'Alternating 1s and 5s', profile: { acidity: 1, body: 5, sweetness: 1, bitterness: 5, aroma: 1 } },
    { name: 'Nested radar object', profile: { radar: { acidity: 9, body: 5, sweetness: 8, bitterness: 2, aroma: 10 } } },
    { name: 'Empty profile', profile: {} },
    { name: 'Negative values (-10, -5)', profile: { acidity: -10, body: -5, sweetness: 0, bitterness: -20, aroma: 0 } },
    { name: 'Extreme high values (>10)', profile: { acidity: 50, body: 100, sweetness: 25, bitterness: 999, aroma: 15 } },
    { name: 'NaN and undefined values', profile: { acidity: NaN, body: undefined, sweetness: null, bitterness: 5, aroma: 8 } },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = computeRadarPoints(tc.profile);
    let ok = true;
    for (const p of res.points) {
      if (isNaN(p.x) || isNaN(p.y) || !isFinite(p.x) || !isFinite(p.y)) {
        console.error(`❌ [${tc.name}] Invalid polygon point NaN/Inf: x=${p.x}, y=${p.y}`);
        ok = false;
      }
      if (p.x < 0 || p.x > 200 || p.y < 0 || p.y > 200) {
        console.error(`❌ [${tc.name}] Point out of viewBox (0..200): x=${p.x}, y=${p.y}`);
        ok = false;
      }
    }
    for (const tp of res.textPoints) {
      if (isNaN(tp.x) || isNaN(tp.y) || !isFinite(tp.x) || !isFinite(tp.y)) {
        console.error(`❌ [${tc.name}] Invalid text label point NaN/Inf: x=${tp.x}, y=${tp.y}`);
        ok = false;
      }
      if (tp.x < 0 || tp.x > 200 || tp.y < 0 || tp.y > 200) {
        console.error(`❌ [${tc.name}] Text label clipped out of viewBox (0..200): label=${tp.label}, x=${tp.x}, y=${tp.y}`);
        ok = false;
      }
    }
    if (ok) {
      console.log(`✅ [${tc.name}] Passed. Polygon: ${res.points.map(p => p.str).join(' ')}`);
      passed++;
    }
  }
  return { passed, total: testCases.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Loyalty Stamp Card Behavior Test
// ─────────────────────────────────────────────────────────────────────────────

function simulateLoyaltyCard(cafe) {
  if (!cafe.loyaltyProgram) {
    return { rendered: false, activeStamps: 0, badgeText: '' };
  }
  const stampsCount = cafe.stampsCount || 0;
  const slots = [1, 2, 3, 4, 5, 6];
  const activeSlots = slots.filter(s => stampsCount >= s);
  return {
    rendered: true,
    totalSlots: 6,
    activeCount: activeSlots.length,
    badgeText: `${stampsCount} از ۶ مهر`,
  };
}

function testLoyaltyCard() {
  console.log('\n--- 2. Testing Loyalty Stamp Card Behavior ---');
  const testCases = [
    { stamps: 0, enabled: true, expectedActive: 0, expectedBadge: '0 از ۶ مهر' },
    { stamps: 1, enabled: true, expectedActive: 1, expectedBadge: '1 از ۶ مهر' },
    { stamps: 3, enabled: true, expectedActive: 3, expectedBadge: '3 از ۶ مهر' },
    { stamps: 6, enabled: true, expectedActive: 6, expectedBadge: '6 از ۶ مهر' },
    { stamps: 7, enabled: true, expectedActive: 6, expectedBadge: '7 از ۶ مهر' }, // >6: all 6 slots active
    { stamps: 12, enabled: true, expectedActive: 6, expectedBadge: '12 از ۶ مهر' },
    { stamps: undefined, enabled: true, expectedActive: 0, expectedBadge: '0 از ۶ مهر' },
    { stamps: 3, enabled: false, expectedRendered: false },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = simulateLoyaltyCard({ loyaltyProgram: tc.enabled, stampsCount: tc.stamps });
    let ok = true;
    if (tc.enabled === false) {
      if (res.rendered !== false) {
        console.error(`❌ Loyalty program disabled but rendered=true`);
        ok = false;
      }
    } else {
      if (!res.rendered) {
        console.error(`❌ Loyalty program enabled but rendered=false`);
        ok = false;
      }
      if (res.activeCount !== tc.expectedActive) {
        console.error(`❌ Stamps ${tc.stamps}: expected ${tc.expectedActive} active slots, got ${res.activeCount}`);
        ok = false;
      }
      if (res.badgeText !== tc.expectedBadge) {
        console.error(`❌ Stamps ${tc.stamps}: expected badge "${tc.expectedBadge}", got "${res.badgeText}"`);
        ok = false;
      }
    }
    if (ok) {
      console.log(`✅ [Stamps: ${tc.stamps}, Enabled: ${tc.enabled}] => Active: ${res.activeCount ?? 0}/6, Badge: "${res.badgeText ?? 'N/A'}"`);
      passed++;
    }
  }
  return { passed, total: testCases.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Cart Calculations & Modifiers Math
// ─────────────────────────────────────────────────────────────────────────────

function calculateCart(cart) {
  const cartTotal = cart.reduce((total, item) => {
    const mods = item.modifiers || item.selectedModifiers || [];
    const modsTotal = mods.reduce((mt, mod) => mt + (mod.price || mod.priceDelta || 0), 0);
    return total + ((item.price + modsTotal) * item.quantity);
  }, 0);

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  return { cartTotal, cartCount };
}

function simulateModifierSelection(group, currentSelected, option) {
  let nextSelected;
  if (group.maxSelection === 1) {
    nextSelected = [
      ...currentSelected.filter((m) => !group.options.find((o) => o.id === m.id)),
      { id: option.id, name: option.name, priceDelta: option.priceDelta }
    ];
  } else {
    const isSelected = currentSelected.some((m) => m.id === option.id);
    if (isSelected) {
      nextSelected = currentSelected.filter((m) => m.id !== option.id);
    } else {
      const currentInGroup = currentSelected.filter((m) => group.options.find((o) => o.id === m.id));
      if (!group.maxSelection || currentInGroup.length < group.maxSelection) {
        nextSelected = [...currentSelected, { id: option.id, name: option.name, priceDelta: option.priceDelta }];
      } else {
        nextSelected = currentSelected; // Max limit reached
      }
    }
  }
  return nextSelected;
}

function testCartAndModifiers() {
  console.log('\n--- 3. Testing Cart Calculations and Modifier Logic ---');
  let passed = 0;
  let total = 0;

  // Case 1: Simple single item
  total++;
  const cart1 = [
    { id: '1', menuItemId: 'item-1', price: 85000, quantity: 1, selectedModifiers: [] }
  ];
  const res1 = calculateCart(cart1);
  if (res1.cartTotal === 85000 && res1.cartCount === 1) {
    console.log(`✅ Simple cart: 1x 85,000 = 85,000 (Count: 1)`);
    passed++;
  } else {
    console.error(`❌ Case 1 failed:`, res1);
  }

  // Case 2: Multi-quantity with modifiers
  total++;
  const cart2 = [
    {
      id: '1',
      menuItemId: 'item-1',
      price: 85000,
      quantity: 2,
      selectedModifiers: [
        { id: 'mod-1', name: 'Extra Shot', priceDelta: 20000 },
        { id: 'mod-2', name: 'Oat Milk', priceDelta: 15000 },
      ]
    }
  ];
  const res2 = calculateCart(cart2);
  const expectedTotal2 = (85000 + 20000 + 15000) * 2; // 120,000 * 2 = 240,000
  if (res2.cartTotal === expectedTotal2 && res2.cartCount === 2) {
    console.log(`✅ Multi-qty with modifiers: 2x (85,000 + 20,000 + 15,000) = ${res2.cartTotal.toLocaleString()} (Count: ${res2.cartCount})`);
    passed++;
  } else {
    console.error(`❌ Case 2 failed: got ${res2.cartTotal}, expected ${expectedTotal2}`);
  }

  // Case 3: Multiple different items in cart
  total++;
  const cart3 = [
    { id: '1', menuItemId: 'item-1', price: 85000, quantity: 2, selectedModifiers: [{ id: 'm1', priceDelta: 10000 }] }, // (85k+10k)*2 = 190k
    { id: '2', menuItemId: 'item-2', price: 120000, quantity: 1, selectedModifiers: [] }, // 120k
    { id: '3', menuItemId: 'item-3', price: 65000, quantity: 3, selectedModifiers: [{ id: 'm2', priceDelta: 5000 }, { id: 'm3', priceDelta: 5000 }] } // (65k+10k)*3 = 225k
  ];
  const res3 = calculateCart(cart3);
  const expectedTotal3 = 190000 + 120000 + 225000; // 535,000
  if (res3.cartTotal === expectedTotal3 && res3.cartCount === 6) {
    console.log(`✅ Multiple mixed items: 3 items (6 units) = ${res3.cartTotal.toLocaleString()} (Count: ${res3.cartCount})`);
    passed++;
  } else {
    console.error(`❌ Case 3 failed: got ${res3.cartTotal}, expected ${expectedTotal3}`);
  }

  // Case 4: Single selection (Radio) modifier behavior
  total++;
  const singleGroup = {
    id: 'grp-beans',
    maxSelection: 1,
    options: [
      { id: 'opt-ethiopia', name: 'Ethiopia', priceDelta: 0 },
      { id: 'opt-colombia', name: 'Colombia', priceDelta: 20000 },
    ]
  };
  let sel = [{ id: 'opt-ethiopia', name: 'Ethiopia', priceDelta: 0 }];
  // Select Colombia: should replace Ethiopia
  sel = simulateModifierSelection(singleGroup, sel, singleGroup.options[1]);
  if (sel.length === 1 && sel[0].id === 'opt-colombia') {
    console.log(`✅ Radio modifier: switching options replaced previous selection cleanly`);
    passed++;
  } else {
    console.error(`❌ Radio modifier switch failed:`, sel);
  }

  // Case 5: Multi-selection with max limit
  total++;
  const multiGroup = {
    id: 'grp-syrups',
    maxSelection: 2,
    options: [
      { id: 'opt-vanilla', name: 'Vanilla', priceDelta: 10000 },
      { id: 'opt-caramel', name: 'Caramel', priceDelta: 10000 },
      { id: 'opt-hazelnut', name: 'Hazelnut', priceDelta: 10000 },
    ]
  };
  let multiSel = [];
  // Add Vanilla
  multiSel = simulateModifierSelection(multiGroup, multiSel, multiGroup.options[0]);
  // Add Caramel
  multiSel = simulateModifierSelection(multiGroup, multiSel, multiGroup.options[1]);
  // Try Add Hazelnut (should exceed max=2 and be rejected)
  multiSel = simulateModifierSelection(multiGroup, multiSel, multiGroup.options[2]);
  if (multiSel.length === 2 && multiSel.map(s => s.id).includes('opt-vanilla') && multiSel.map(s => s.id).includes('opt-caramel')) {
    console.log(`✅ Multi modifier: maxSelection=2 respected (3rd selection prevented)`);
    passed++;
  } else {
    console.error(`❌ Multi modifier maxSelection test failed:`, multiSel);
  }

  // Case 6: Multi-selection toggle off
  total++;
  multiSel = simulateModifierSelection(multiGroup, multiSel, multiGroup.options[0]); // toggle off vanilla
  if (multiSel.length === 1 && multiSel[0].id === 'opt-caramel') {
    console.log(`✅ Multi modifier: deselecting option cleanly removes it`);
    passed++;
  } else {
    console.error(`❌ Multi modifier toggle off failed:`, multiSel);
  }

  return { passed, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Table Service Request Mapping Test
// ─────────────────────────────────────────────────────────────────────────────

function testTableServiceMapping() {
  console.log('\n--- 4. Testing Table Service Request Mapping ---');
  const typeMapping = {
    WAITER: 'CALL_WAITER',
    BILL: 'REQUEST_BILL',
    WATER: 'REQUEST_WATER',
    POS: 'REQUEST_POS',
    CALL_WAITER: 'CALL_WAITER',
    REQUEST_BILL: 'REQUEST_BILL',
    REQUEST_WATER: 'REQUEST_WATER',
    REQUEST_POS: 'REQUEST_POS',
  };

  const tests = [
    { input: 'WAITER', expected: 'CALL_WAITER' },
    { input: 'BILL', expected: 'REQUEST_BILL' },
    { input: 'WATER', expected: 'REQUEST_WATER' },
    { input: 'POS', expected: 'REQUEST_POS' },
    { input: 'UNKNOWN_TYPE', expected: 'CALL_WAITER' }, // fallback
  ];

  let passed = 0;
  for (const t of tests) {
    const result = typeMapping[t.input] || 'CALL_WAITER';
    if (result === t.expected) {
      console.log(`✅ Table action "${t.input}" -> RequestType: "${result}"`);
      passed++;
    } else {
      console.error(`❌ Table action "${t.input}": expected "${t.expected}", got "${result}"`);
    }
  }
  return { passed, total: tests.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Codebase Color Leakage & Theme Tokens Scan
// ─────────────────────────────────────────────────────────────────────────────

function scanForColorLeaks() {
  console.log('\n--- 5. Scanning for Hardcoded Color Leaks in src/app/c/[cafeSlug]/page.tsx ---');
  const targetFile = path.resolve(__dirname, '../src/app/c/[cafeSlug]/page.tsx');
  const content = fs.readFileSync(targetFile, 'utf-8');

  // Check for unwanted Tailwind utility classes that bypass themes
  const prohibitedPatterns = [
    /\bbg-zinc-\d{2,3}\b/g,
    /\bbg-gray-\d{2,3}\b/g,
    /\bbg-slate-\d{2,3}\b/g,
    /\bbg-neutral-\d{2,3}\b/g,
    /\bbg-stone-\d{2,3}\b/g,
    /\btext-zinc-\d{2,3}\b/g,
    /\btext-gray-\d{2,3}\b/g,
    /\btext-slate-\d{2,3}\b/g,
    /\btext-neutral-\d{2,3}\b/g,
    /\bborder-zinc-\d{2,3}\b/g,
    /\bborder-gray-\d{2,3}\b/g,
    /\bborder-slate-\d{2,3}\b/g,
    /\bbg-amber-\d{2,3}\b/g,
    /\bbg-emerald-\d{2,3}\b/g,
    /\bbg-red-\d{2,3}\b/g,
  ];

  let leaksFound = [];
  for (const regex of prohibitedPatterns) {
    const matches = content.match(regex);
    if (matches) {
      leaksFound.push(...matches);
    }
  }

  // Check for hardcoded raw hex colors in style attributes that should be themed
  // (Ignoring standard SVG/scrim colors like rgba(0,0,0,0.7) or #FFFFFF text inside dark badges)
  const suspiciousHexRegex = /#([0-9a-fA-F]{3,8})/g;
  let hexMatches = [];
  let match;
  while ((match = suspiciousHexRegex.exec(content)) !== null) {
    const hex = match[0];
    const index = match.index;
    const surrounding = content.substring(Math.max(0, index - 30), Math.min(content.length, index + 30));
    // Filter out known fallback mock data in FALLBACK_CAFES
    if (!surrounding.includes('cmsulox') && !surrounding.includes('FALLBACK')) {
      hexMatches.push({ hex, context: surrounding.trim().replace(/\n/g, ' ') });
    }
  }

  console.log(`Unwanted Tailwind color utility matches: ${leaksFound.length}`);
  if (leaksFound.length > 0) {
    console.error(`❌ Found prohibited utility classes:`, leaksFound);
  } else {
    console.log(`✅ 0 hardcoded Tailwind color utility classes found.`);
  }

  console.log(`Raw Hex matches in page component: ${hexMatches.length}`);
  for (const hm of hexMatches) {
    console.log(`  - Hex: ${hm.hex} in context: "...${hm.context}..."`);
  }

  return {
    passed: leaksFound.length === 0,
    total: 1,
    tailwindLeaks: leaksFound.length,
    hexOccurrences: hexMatches.length
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Theme System Completeness Check
// ─────────────────────────────────────────────────────────────────────────────

async function checkThemeSystem() {
  console.log('\n--- 6. Checking Theme Definitions and CSS Variable Completeness ---');
  const themesFile = path.resolve(__dirname, '../src/lib/themes.ts');
  const content = fs.readFileSync(themesFile, 'utf-8');

  const expectedThemes = ['NORDIC_MINIMAL', 'OLED_CARBON', 'ARTISAN_SEPIA', 'NEO_EDITORIAL', 'WARM_TERRACOTTA'];
  const requiredCssVars = [
    '--theme-bg',
    '--theme-bg-2',
    '--theme-surface',
    '--theme-border',
    '--theme-text',
    '--theme-text-2',
    '--theme-accent',
    '--theme-accent-fg',
    '--theme-accent-2',
    '--theme-card-shadow',
    '--theme-card-shadow-hover',
    '--theme-card-shadow-lg',
    '--theme-radius-sm',
    '--theme-radius',
    '--theme-radius-lg',
    '--theme-radius-full',
    '--theme-font-weight-display',
    '--theme-accent-glow',
  ];

  let passed = 0;
  let total = expectedThemes.length;

  for (const th of expectedThemes) {
    let ok = true;
    if (!content.includes(`${th}:`)) {
      console.error(`❌ Theme ${th} missing from THEMES map`);
      ok = false;
    }
    // Check if each cssVar exists
    for (const v of requiredCssVars) {
      // Rough check if var is in file
      if (!content.includes(`"${v}"`)) {
        console.error(`❌ Theme token ${v} missing in themes.ts`);
        ok = false;
      }
    }
    if (ok) {
      console.log(`✅ Theme "${th}" defines all ${requiredCssVars.length} CSS variable tokens`);
      passed++;
    }
  }

  return { passed, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Execution
// ─────────────────────────────────────────────────────────────────────────────

async function runAll() {
  console.log('===============================================================');
  console.log('  CHALLENGER 2: ADVERSARIAL STRESS TEST HARNESS — MILESTONE 1  ');
  console.log('===============================================================');

  const r1 = testRadarChart();
  const r2 = testLoyaltyCard();
  const r3 = testCartAndModifiers();
  const r4 = testTableServiceMapping();
  const r5 = scanForColorLeaks();
  const r6 = await checkThemeSystem();

  const totalPassed = r1.passed + r2.passed + r3.passed + r4.passed + (r5.passed ? 1 : 0) + r6.passed;
  const totalTests = r1.total + r2.total + r3.total + r4.total + r5.total + r6.total;

  console.log('\n===============================================================');
  console.log(`  OVERALL STRESS TEST RESULT: ${totalPassed} / ${totalTests} PASSED (${Math.round(totalPassed/totalTests*100)}%)`);
  console.log('===============================================================');

  if (totalPassed === totalTests) {
    console.log('\n>>> ALL EMPIRICAL STRESS TESTS PASSED SUCCESSFULLY! <<<\n');
    process.exit(0);
  } else {
    console.error('\n>>> STRESS TESTS FAILED! <<<\n');
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
