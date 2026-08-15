import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload, UserRole } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Monkey-Patch next/headers for In-Process Next.js Route Handler Testing
// ─────────────────────────────────────────────────────────────────────────────

const mockCookieStore = new Map<string, string>();

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nextHeaders = require("next/headers");
  nextHeaders.cookies = async () => ({
    get: (name: string) => {
      const val = mockCookieStore.get(name);
      return val !== undefined ? { name, value: val } : undefined;
    },
    set: (name: string, value: string) => {
      mockCookieStore.set(name, value);
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
    getAll: () =>
      Array.from(mockCookieStore.entries()).map(([name, value]) => ({
        name,
        value,
      })),
    has: (name: string) => mockCookieStore.has(name),
  });
} catch {
  // Ignore if not in Node runtime with next/headers
}

export function setMockCookie(name: string, value: string): void {
  mockCookieStore.set(name, value);
}

export function clearMockCookies(): void {
  mockCookieStore.clear();
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. JWT & Auth Helpers
// ─────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "cafechi-fallback-secret-key-min-32-chars"
);

const SEED_USERS: Record<UserRole, { id: string; phone: string; fullName: string }> = {
  SUPER_ADMIN: {
    id: "cmsuloxvs00005su44wiiq8ag",
    phone: "09120000000",
    fullName: "مدیر ارشد سیستم",
  },
  CAFE_OWNER: {
    id: "cmsuloxw100015su4okl3c4vg",
    phone: "09121111111",
    fullName: "علی رضایی",
  },
  STAFF: {
    id: "cmsuloxwc00035su47xqfs8tx",
    phone: "09123333333",
    fullName: "رضا باریستا",
  },
  CUSTOMER: {
    id: "cmsuloxwh00045su4v8d1bn9s",
    phone: "09124444444",
    fullName: "نیلوفر احمدی",
  },
};

export async function generateTestToken(
  payload: Partial<JWTPayload> & { sub?: string; phone?: string; role?: UserRole; fullName?: string }
): Promise<string> {
  const role = payload.role ?? "CUSTOMER";
  const defaultUser = SEED_USERS[role];

  const fullPayload: JWTPayload = {
    sub: payload.sub ?? defaultUser.id,
    phone: payload.phone ?? defaultUser.phone,
    role,
    fullName: payload.fullName ?? defaultUser.fullName,
    cafeId: payload.cafeId,
    stationId: payload.stationId,
    ...payload,
  };

  return await new SignJWT(fullPayload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function createAuthHeader(
  role: UserRole = "CUSTOMER",
  cafeId?: string,
  extra?: Partial<JWTPayload>
): Promise<{ Authorization: string }> {
  const defaultUser = SEED_USERS[role];
  const token = await generateTestToken({
    role,
    cafeId,
    sub: extra?.sub ?? defaultUser.id,
    phone: extra?.phone ?? defaultUser.phone,
    fullName: extra?.fullName ?? defaultUser.fullName,
    stationId: extra?.stationId,
    ...extra,
  });
  setMockCookie("cafechi_session", token);
  return { Authorization: `Bearer ${token}` };
}

export async function setAuthSession(
  role: UserRole = "CUSTOMER",
  cafeId?: string,
  extra?: Partial<JWTPayload>
): Promise<string> {
  const defaultUser = SEED_USERS[role];
  const token = await generateTestToken({
    role,
    cafeId,
    sub: extra?.sub ?? defaultUser.id,
    phone: extra?.phone ?? defaultUser.phone,
    fullName: extra?.fullName ?? defaultUser.fullName,
    stationId: extra?.stationId,
    ...extra,
  });
  setMockCookie("cafechi_session", token);
  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mock Request Factory
// ─────────────────────────────────────────────────────────────────────────────

export interface MockRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
  user?: Partial<JWTPayload>;
}

export function createMockRequest(
  url: string,
  options: MockRequestOptions = {}
): Request {
  const method = options.method ?? (options.body ? "POST" : "GET");
  const headers = new Headers(options.headers ?? {});

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
    setMockCookie("cafechi_session", options.token);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url.startsWith("/") ? "" : "/"}${url}`;

  return new Request(fullUrl, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Assertion Library
// ─────────────────────────────────────────────────────────────────────────────

export class AssertionError extends Error {
  constructor(message: string, public actual?: unknown, public expected?: unknown) {
    super(message);
    this.name = "AssertionError";
  }
}

export function assert(cond: unknown, msg = "Assertion failed"): asserts cond {
  if (!cond) {
    throw new AssertionError(msg, false, true);
  }
}

export function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    const errorMsg = msg ?? `Expected ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`;
    throw new AssertionError(errorMsg, actual, expected);
  }
}

export function assertDeepEqual<T>(actual: T, expected: T, msg?: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const errorMsg = msg ?? `Deep equality mismatch:\nExpected: ${expectedStr}\nReceived: ${actualStr}`;
    throw new AssertionError(errorMsg, actual, expected);
  }
}

export async function assertThrowsAsync(
  fn: () => Promise<unknown>,
  msg = "Expected function to throw, but it succeeded"
): Promise<void> {
  try {
    await fn();
  } catch {
    return; // Passed
  }
  throw new AssertionError(msg);
}

export function assertDefined<T>(
  val: T,
  msg = "Expected value to be defined and not null"
): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError(msg, val, "NonNullable");
  }
}

export function assertInRange(
  val: number,
  min: number,
  max: number,
  msg?: string
): void {
  if (val < min || val > max) {
    const errorMsg = msg ?? `Expected ${val} to be within range [${min}, ${max}]`;
    throw new AssertionError(errorMsg, val, `[${min}, ${max}]`);
  }
}

export function assertMatches(val: string, re: RegExp, msg?: string): void {
  if (!re.test(val)) {
    const errorMsg = msg ?? `Expected "${val}" to match pattern ${re.toString()}`;
    throw new AssertionError(errorMsg, val, re.toString());
  }
}

export function assertIncludes<T>(
  container: T[] | string,
  item: T | string,
  msg?: string
): void {
  if (typeof container === "string" && typeof item === "string") {
    if (!container.includes(item)) {
      const errorMsg = msg ?? `Expected "${container}" to include "${item}"`;
      throw new AssertionError(errorMsg, container, item);
    }
    return;
  }
  if (Array.isArray(container)) {
    if (!container.includes(item as T)) {
      const errorMsg = msg ?? `Expected array to include ${JSON.stringify(item)}`;
      throw new AssertionError(errorMsg, container, item);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Test Registration & Execution Engine
// ─────────────────────────────────────────────────────────────────────────────

export interface TestCase {
  id: string;
  name: string;
  fn: () => void | Promise<void>;
  tier: number;
  feature?: number;
  suiteName: string;
}

export interface TestSuite {
  name: string;
  tier: number;
  feature?: number;
  tests: TestCase[];
  beforeAllFns: (() => void | Promise<void>)[];
  afterAllFns: (() => void | Promise<void>)[];
  beforeEachFns: (() => void | Promise<void>)[];
  afterEachFns: (() => void | Promise<void>)[];
}

export interface TestResult {
  test: TestCase;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export class TestRegistry {
  private static instance: TestRegistry;
  private suites: TestSuite[] = [];
  private currentSuite: TestSuite | null = null;
  private currentTier = 1;
  private currentFeature?: number;

  private constructor() {}

  public static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  public setContext(tier: number, feature?: number): void {
    this.currentTier = tier;
    this.currentFeature = feature;
  }

  public describe(name: string, fn: () => void): void {
    const suite: TestSuite = {
      name,
      tier: this.currentTier,
      feature: this.currentFeature,
      tests: [],
      beforeAllFns: [],
      afterAllFns: [],
      beforeEachFns: [],
      afterEachFns: [],
    };
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    this.suites.push(suite);
    fn();
    this.currentSuite = prevSuite;
  }

  public registerTest(name: string, fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      this.describe("Default Suite", () => {});
    }
    const suite = this.currentSuite!;
    const testId = `T${suite.tier}${suite.feature ? `.${suite.feature}` : ""}.${suite.tests.length + 1}`;
    suite.tests.push({
      id: testId,
      name,
      fn,
      tier: suite.tier,
      feature: suite.feature,
      suiteName: suite.name,
    });
  }

  public beforeAll(fn: () => void | Promise<void>): void {
    if (this.currentSuite) {
      this.currentSuite.beforeAllFns.push(fn);
    }
  }

  public afterAll(fn: () => void | Promise<void>): void {
    if (this.currentSuite) {
      this.currentSuite.afterAllFns.push(fn);
    }
  }

  public beforeEach(fn: () => void | Promise<void>): void {
    if (this.currentSuite) {
      this.currentSuite.beforeEachFns.push(fn);
    }
  }

  public afterEach(fn: () => void | Promise<void>): void {
    if (this.currentSuite) {
      this.currentSuite.afterEachFns.push(fn);
    }
  }

  public getSuites(): TestSuite[] {
    return this.suites;
  }

  public getAllTests(): TestCase[] {
    return this.suites.flatMap((s) => s.tests);
  }

  public clear(): void {
    this.suites = [];
    this.currentSuite = null;
  }
}

export const registry = TestRegistry.getInstance();

export function setTestScope(tier: number, feature?: number): void {
  registry.setContext(tier, feature);
}

export function describe(name: string, fn: () => void): void {
  registry.describe(name, fn);
}

export function it(name: string, fn: () => void | Promise<void>): void {
  registry.registerTest(name, fn);
}

export const test = it;

export function beforeAll(fn: () => void | Promise<void>): void {
  registry.beforeAll(fn);
}

export function afterAll(fn: () => void | Promise<void>): void {
  registry.afterAll(fn);
}

export function beforeEach(fn: () => void | Promise<void>): void {
  registry.beforeEach(fn);
}

export function afterEach(fn: () => void | Promise<void>): void {
  registry.afterEach(fn);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Test Runner & Reporting
// ─────────────────────────────────────────────────────────────────────────────

export interface RunFilterOptions {
  tier?: number;
  feature?: number;
  grep?: string;
  silent?: boolean;
}

export interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  tierBreakdown: Record<number, { total: number; passed: number; failed: number; durationMs: number }>;
  results: TestResult[];
}

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m\x1b[30m",
  bgRed: "\x1b[41m\x1b[37m",
};

export async function runAllTests(options: RunFilterOptions = {}): Promise<RunSummary> {
  const suites = registry.getSuites();
  const startTime = Date.now();
  const results: TestResult[] = [];
  const tierBreakdown: Record<number, { total: number; passed: number; failed: number; durationMs: number }> = {
    1: { total: 0, passed: 0, failed: 0, durationMs: 0 },
    2: { total: 0, passed: 0, failed: 0, durationMs: 0 },
    3: { total: 0, passed: 0, failed: 0, durationMs: 0 },
    4: { total: 0, passed: 0, failed: 0, durationMs: 0 },
  };

  const isSilent = options.silent ?? false;

  for (const suite of suites) {
    if (options.tier !== undefined && suite.tier !== options.tier) {
      continue;
    }
    if (options.feature !== undefined && suite.feature !== options.feature) {
      continue;
    }

    const filteredTests = suite.tests.filter((t) => {
      if (options.grep) {
        const regex = new RegExp(options.grep, "i");
        return regex.test(t.name) || regex.test(suite.name) || regex.test(t.id);
      }
      return true;
    });

    if (filteredTests.length === 0) continue;

    if (!isSilent) {
      console.log(`\n${colors.bold}${colors.cyan}▶ [Tier ${suite.tier}] ${suite.name}${colors.reset}`);
    }

    for (const beforeFn of suite.beforeAllFns) {
      await beforeFn();
    }

    const suiteStartTime = Date.now();

    for (const testCase of filteredTests) {
      clearMockCookies();
      for (const beforeChild of suite.beforeEachFns) {
        await beforeChild();
      }

      const testStartTime = Date.now();
      let passed = false;
      let error: Error | undefined;

      try {
        await testCase.fn();
        passed = true;
      } catch (err: unknown) {
        passed = false;
        error = err instanceof Error ? err : new Error(String(err));
      }

      const durationMs = Date.now() - testStartTime;

      for (const afterChild of suite.afterEachFns) {
        await afterChild();
      }

      const testResult: TestResult = {
        test: testCase,
        passed,
        error,
        durationMs,
      };

      results.push(testResult);

      if (!tierBreakdown[suite.tier]) {
        tierBreakdown[suite.tier] = { total: 0, passed: 0, failed: 0, durationMs: 0 };
      }
      tierBreakdown[suite.tier].total++;
      if (passed) {
        tierBreakdown[suite.tier].passed++;
      } else {
        tierBreakdown[suite.tier].failed++;
      }

      if (!isSilent) {
        const badge = passed
          ? `${colors.green}✓ PASS${colors.reset}`
          : `${colors.red}✗ FAIL${colors.reset}`;
        const timeStr = `${colors.dim}(${durationMs}ms)${colors.reset}`;
        console.log(`  ${badge} ${colors.bold}${testCase.id}${colors.reset} ${testCase.name} ${timeStr}`);
        if (!passed && error) {
          console.log(`    ${colors.red}↳ ${error.message}${colors.reset}`);
          if (error.stack) {
            const stackLines = error.stack.split("\n").slice(1, 4).join("\n");
            console.log(`    ${colors.dim}${stackLines}${colors.reset}`);
          }
        }
      }
    }

    for (const afterFn of suite.afterAllFns) {
      await afterFn();
    }

    const suiteDuration = Date.now() - suiteStartTime;
    tierBreakdown[suite.tier].durationMs += suiteDuration;
  }

  const totalDuration = Date.now() - startTime;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    durationMs: totalDuration,
    tierBreakdown,
    results,
  };
}

export function printSummaryTable(summary: RunSummary): void {
  console.log("\n" + "═".repeat(78));
  console.log(`${colors.bold}${colors.cyan}             CafeChi E2E 4-Tier Test Suite Summary Report             ${colors.reset}`);
  console.log("═".repeat(78));

  console.log(
    `${colors.bold}${"Tier".padEnd(8)} ${"Category".padEnd(36)} ${"Tests".padEnd(8)} ${"Passed".padEnd(8)} ${"Failed".padEnd(8)} ${"Duration"}${colors.reset}`
  );
  console.log("─".repeat(78));

  const tierNames: Record<number, string> = {
    1: "Feature Coverage (12 Features)",
    2: "Boundary & Corner Cases (12 Features)",
    3: "Cross-Feature Combinations",
    4: "Real-World Workload Scenarios",
  };

  for (let tier = 1; tier <= 4; tier++) {
    const stats = summary.tierBreakdown[tier] ?? { total: 0, passed: 0, failed: 0, durationMs: 0 };
    const name = tierNames[tier] ?? `Tier ${tier}`;
    const statusColor = stats.failed > 0 ? colors.red : colors.green;
    console.log(
      `${colors.bold}Tier ${tier}${colors.reset}`.padEnd(16) +
      `${name}`.padEnd(36) +
      `${stats.total}`.padEnd(8) +
      `${statusColor}${stats.passed}${colors.reset}`.padEnd(16) +
      `${stats.failed > 0 ? colors.red : colors.dim}${stats.failed}${colors.reset}`.padEnd(16) +
      `${stats.durationMs}ms`
    );
  }

  console.log("─".repeat(78));
  const finalStatus =
    summary.failed === 0
      ? `${colors.bgGreen} ALL ${summary.total} TESTS PASSED ${colors.reset}`
      : `${colors.bgRed} ${summary.failed} OF ${summary.total} TESTS FAILED ${colors.reset}`;

  console.log(
    `${colors.bold}TOTAL:${colors.reset}   ${summary.total} tests | ` +
    `${colors.green}${summary.passed} passed${colors.reset} | ` +
    `${summary.failed > 0 ? colors.red : colors.dim}${summary.failed} failed${colors.reset} | ` +
    `${colors.cyan}Duration: ${summary.durationMs}ms${colors.reset}`
  );
  console.log(`\nResult: ${finalStatus}\n`);
}
