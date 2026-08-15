import { THEMES, THEME_LIST, getTheme, getThemeCssString } from '../src/lib/themes';
import type { ThemeId, ThemeDefinition } from '../src/types';

// Helper for WCAG Luminance and Contrast calculation
function hexToRgb(hex: string): [number, number, number] {
  let c = hex.trim().replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(name: string, condition: boolean, details?: string) {
  results.push({ name, passed: condition, details });
  const status = condition ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} - ${name}${details ? ` (${details})` : ''}`);
}

console.log('══════════════════════════════════════════════════════════════════════');
console.log('       EMPIRICAL CHALLENGER: 5-THEME ADVERSARIAL STRESS TEST SUITE    ');
console.log('══════════════════════════════════════════════════════════════════════\n');

const EXPECTED_THEMES: ThemeId[] = [
  'NORDIC_MINIMAL',
  'OLED_CARBON',
  'ARTISAN_SEPIA',
  'NEO_EDITORIAL',
  'WARM_TERRACOTTA',
];

const REQUIRED_CSS_VARS = [
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

const REQUIRED_PREVIEW_KEYS = ['bg', 'surface', 'text', 'accent', 'border'];

// ─── SUITE 1: Theme Definition Integrity & Parity ───────────────────────────
console.log('▶ Suite 1: Theme Definition Completeness & 100% Token Parity');

record('All 5 themes present in THEMES map', 
  EXPECTED_THEMES.every(id => id in THEMES),
  `Found: ${Object.keys(THEMES).join(', ')}`
);

record('THEME_LIST contains exactly 5 themes matching keys',
  THEME_LIST.length === 5 && THEME_LIST.every(t => EXPECTED_THEMES.includes(t.id)),
  `Count: ${THEME_LIST.length}`
);

for (const id of EXPECTED_THEMES) {
  const theme = THEMES[id];
  record(`Theme [${id}] has valid structure`, 
    Boolean(
      theme.id === id &&
      typeof theme.name === 'string' && theme.name.length > 0 &&
      typeof theme.nameFa === 'string' && theme.nameFa.length > 0 &&
      typeof theme.description === 'string' && theme.description.length > 0 &&
      typeof theme.preview === 'object' &&
      typeof theme.cssVars === 'object'
    )
  );

  // Preview keys
  const previewKeys = Object.keys(theme.preview);
  const hasAllPreview = REQUIRED_PREVIEW_KEYS.every(k => k in theme.preview);
  record(`Theme [${id}] preview keys complete`, 
    hasAllPreview,
    `Preview keys: ${previewKeys.join(', ')}`
  );

  // CSS vars check
  const cssVars = theme.cssVars;
  const missingVars = REQUIRED_CSS_VARS.filter(v => !(v in cssVars));
  record(`Theme [${id}] contains all 18 required CSS variables`,
    missingVars.length === 0,
    missingVars.length > 0 ? `Missing: ${missingVars.join(', ')}` : `18/18 tokens present`
  );
}

// ─── SUITE 2: Value Formats and Syntax Integrity ────────────────────────────
console.log('\n▶ Suite 2: Color, Radius, Typography & Shadow Syntax Verification');

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const radiusRegex = /^(0px|none|[0-9]+(px|rem))$/;
const fontWeightRegex = /^[1-9]00$/;

for (const id of EXPECTED_THEMES) {
  const theme = THEMES[id];
  const vars = theme.cssVars;

  // Hex color tokens
  const hexTokens = [
    '--theme-bg',
    '--theme-bg-2',
    '--theme-surface',
    '--theme-border',
    '--theme-text',
    '--theme-text-2',
    '--theme-accent',
    '--theme-accent-fg',
    '--theme-accent-2',
  ];

  const invalidHex = hexTokens.filter(t => !hexRegex.test(vars[t]));
  record(`Theme [${id}] all 9 core color tokens are valid HEX`,
    invalidHex.length === 0,
    invalidHex.length > 0 ? `Invalid: ${invalidHex.map(t => `${t}=${vars[t]}`).join(', ')}` : 'All valid hex'
  );

  // Radii format
  const radiusTokens = ['--theme-radius-sm', '--theme-radius', '--theme-radius-lg', '--theme-radius-full'];
  const invalidRadius = radiusTokens.filter(t => !radiusRegex.test(vars[t]));
  record(`Theme [${id}] all radius tokens are valid CSS dimensions`,
    invalidRadius.length === 0,
    invalidRadius.length > 0 ? `Invalid: ${invalidRadius.map(t => `${t}=${vars[t]}`).join(', ')}` : 'All valid radii'
  );

  // Font weight display
  record(`Theme [${id}] display font weight is valid 100-900 weight`,
    fontWeightRegex.test(vars['--theme-font-weight-display']),
    `Weight: ${vars['--theme-font-weight-display']}`
  );

  // Shadow tokens
  const shadowTokens = ['--theme-card-shadow', '--theme-card-shadow-hover', '--theme-card-shadow-lg'];
  const validShadows = shadowTokens.every(t => typeof vars[t] === 'string' && vars[t].length > 0);
  record(`Theme [${id}] shadow tokens exist and non-empty`, validShadows);

  // Accent glow
  const glow = vars['--theme-accent-glow'];
  const validGlow = glow === 'none' || glow.startsWith('rgba(') || glow.startsWith('rgb(') || hexRegex.test(glow);
  record(`Theme [${id}] accent glow is valid RGBA / none`, validGlow, `Glow: ${glow}`);
}

// ─── SUITE 3: WCAG AA Contrast Ratios Verification ──────────────────────────
console.log('\n▶ Suite 3: WCAG AA Accessibility Contrast Ratios');

for (const id of EXPECTED_THEMES) {
  const vars = THEMES[id].cssVars;
  const textBg = getContrastRatio(vars['--theme-text'], vars['--theme-bg']);
  const textSurface = getContrastRatio(vars['--theme-text'], vars['--theme-surface']);
  const text2Surface = getContrastRatio(vars['--theme-text-2'], vars['--theme-surface']);
  const accentFg = getContrastRatio(vars['--theme-accent-fg'], vars['--theme-accent']);

  record(`Theme [${id}] Primary Text vs Surface contrast >= 4.5:1 (WCAG AA)`,
    textSurface >= 4.5,
    `Ratio: ${textSurface.toFixed(2)}:1`
  );

  record(`Theme [${id}] Primary Text vs Background contrast >= 4.5:1 (WCAG AA)`,
    textBg >= 4.5,
    `Ratio: ${textBg.toFixed(2)}:1`
  );

  record(`Theme [${id}] Secondary Text vs Surface contrast >= 3.0:1 (Large/Muted)`,
    text2Surface >= 3.0,
    `Ratio: ${text2Surface.toFixed(2)}:1`
  );

  record(`Theme [${id}] Accent Foreground vs Accent Button contrast >= 3.0:1 (UI Components)`,
    accentFg >= 3.0,
    `Ratio: ${accentFg.toFixed(2)}:1`
  );
}

// ─── SUITE 4: Adversarial Input & Fallback Robustness ───────────────────────
console.log('\n▶ Suite 4: Adversarial Fallback & Error Resilience');

const ADVERSARIAL_CASES: Array<{ label: string; input: any }> = [
  { label: 'undefined', input: undefined },
  { label: 'null', input: null },
  { label: 'empty string ""', input: '' },
  { label: 'unknown ID "CYBERPUNK_NEON"', input: 'CYBERPUNK_NEON' },
  { label: 'lowercase "nordic_minimal"', input: 'nordic_minimal' },
  { label: 'spaced "NORDIC MINIMAL"', input: 'NORDIC MINIMAL' },
  { label: 'special chars "<script>alert(1)</script>"', input: '<script>alert(1)</script>' },
  { label: 'SQL injection "NORDIC_MINIMAL\' OR 1=1--"', input: "NORDIC_MINIMAL' OR 1=1--" },
  { label: 'prototype pollution "__proto__"', input: '__proto__' },
  { label: 'prototype property "constructor"', input: 'constructor' },
  { label: 'prototype property "toString"', input: 'toString' },
  { label: 'number 9999', input: 9999 },
  { label: 'object {}', input: {} },
  { label: 'array []', input: [] },
  { label: 'boolean false', input: false },
];

for (const tc of ADVERSARIAL_CASES) {
  let themeRes: ThemeDefinition | null = null;
  let cssRes: string | null = null;
  let threw = false;

  try {
    themeRes = getTheme(tc.input);
    cssRes = getThemeCssString(tc.input);
  } catch (e) {
    threw = true;
  }

  record(`Fallback robustness for input [${tc.label}]`,
    !threw && 
    themeRes !== null && 
    themeRes.id === 'NORDIC_MINIMAL' &&
    typeof cssRes === 'string' &&
    cssRes.includes('--theme-bg: #F6F3EE;') &&
    cssRes.includes('--theme-accent: #8B5E3C;'),
    `getTheme: ${themeRes?.id}, CSS len: ${cssRes?.length}`
  );
}

// ─── SUITE 5: getThemeCssString Output Format & Invertibility ───────────────
console.log('\n▶ Suite 5: CSS String Generator Correctness & Syntax');

for (const id of EXPECTED_THEMES) {
  const css = getThemeCssString(id);
  const theme = THEMES[id];
  
  // Verify starts/ends well, declarations have proper syntax
  const declarations = css.split(';').map(s => s.trim()).filter(Boolean);
  record(`Theme [${id}] CSS string contains 18 semicolon-delimited declarations`,
    declarations.length === 18,
    `Declaration count: ${declarations.length}`
  );

  let allValid = true;
  for (const decl of declarations) {
    const parts = decl.split(': ');
    if (parts.length !== 2) {
      allValid = false;
      break;
    }
    const [key, val] = parts;
    if (!key.startsWith('--theme-') || theme.cssVars[key] !== val) {
      allValid = false;
      break;
    }
  }

  record(`Theme [${id}] CSS declarations match cssVars map exactly`, allValid);
}

// ─── SUITE 6: Distinct Identity & Theme Divergence ──────────────────────────
console.log('\n▶ Suite 6: Visual Identity Differentiation');

// Ensure each theme has distinct primary accent and surface colors
const accents = EXPECTED_THEMES.map(id => THEMES[id].cssVars['--theme-accent']);
const uniqueAccents = new Set(accents);
record('All 5 themes have distinct accent colors', 
  uniqueAccents.size === 5,
  `Distinct accents: ${uniqueAccents.size}/5`
);

const bgs = EXPECTED_THEMES.map(id => THEMES[id].cssVars['--theme-bg']);
const uniqueBgs = new Set(bgs);
record('All 5 themes have distinct background tones',
  uniqueBgs.size === 5,
  `Distinct bgs: ${uniqueBgs.size}/5`
);

// Verify Neo Editorial brutalist sharp 0px radius
record('NEO_EDITORIAL enforces strict brutalist 0px radius and solid hard shadows',
  THEMES.NEO_EDITORIAL.cssVars['--theme-radius'] === '0px' &&
  THEMES.NEO_EDITORIAL.cssVars['--theme-radius-sm'] === '0px' &&
  THEMES.NEO_EDITORIAL.cssVars['--theme-radius-lg'] === '0px' &&
  THEMES.NEO_EDITORIAL.cssVars['--theme-card-shadow'].includes('0px #')
);

// Verify OLED Carbon deep dark values
record('OLED_CARBON enforces true pitch black #080808 background and amber accent #F59E0B',
  THEMES.OLED_CARBON.cssVars['--theme-bg'] === '#080808' &&
  THEMES.OLED_CARBON.cssVars['--theme-surface'] === '#181818' &&
  THEMES.OLED_CARBON.cssVars['--theme-accent'] === '#F59E0B'
);

// ─── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════════');
const total = results.length;
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log(`VERDICT: ${failed === 0 ? 'APPROVE (100% Pass)' : 'REQUEST_CHANGES'}`);
console.log('══════════════════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
