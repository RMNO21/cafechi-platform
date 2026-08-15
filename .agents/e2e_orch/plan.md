# Plan: CafeChi E2E Testing Suite (Tiers 1-4)

## Objective
Build and validate a comprehensive 4-tier opaque-box E2E test suite covering all 12 key platform features with ≥140 test cases, verifying 100% pass rate, and publishing `TEST_READY.md`.

## Step 1: Environment & Architecture Survey (Explorer)
- Inspect project structure, dependencies (`package.json`), TypeScript setup, and existing tests in `tests/`.
- Verify available test execution tools (e.g., `tsx`, `vitest`, `jest`, or custom TypeScript runner).
- Propose modular test file layout:
  - `tests/harness.ts` (shared assertions, mocks, runner helpers)
  - `tests/tier1-features.test.ts` (12 features × ≥5 tests = ≥60 tests)
  - `tests/tier2-boundaries.test.ts` (12 features × ≥5 tests = ≥60 tests)
  - `tests/tier3-combinations.test.ts` (Cross-feature flows = ≥15 tests)
  - `tests/tier4-scenarios.test.ts` (Real-world dining & barista workflows = ≥6 tests)
  - `tests/runner.ts` (Master runner coordinating all tiers, timing, colorized reporting, and exit code 0/1)

## Step 2: Implementation of Test Harness & Suites (Test Writer / Worker)
- Implement `tests/harness.ts` and runner utilities.
- Implement Tier 1 (all 12 features verified in isolation, ≥60 tests).
- Implement Tier 2 (extreme values, empty arrays, unicode strings, zero numbers, radar bounds, ≥60 tests).
- Implement Tier 3 (pairwise combinations: theme switching + cart + loyalty + KDS + checkout, ≥15 tests).
- Implement Tier 4 (complete customer dining journey, barista rush, table service dispatch, admin approval lifecycle, ≥6 scenarios).
- Implement master runner `tests/runner.ts` / `tests/e2e-runner.ts` with clean CLI summary and exit codes.

## Step 3: Test Suite Execution & Validation (Worker)
- Run the full test suite.
- Ensure all ≥141 tests pass cleanly with exit code 0.
- Verify that `npm test` or `npx tsx tests/runner.ts` runs without external service dependencies (opaque-box, hermetic).

## Step 4: Quality Gate & Forensic Verification
- Reviewer: Verify opaque-box adherence, coverage completeness, and assert correctness.
- Challenger: Test adversarial stress cases, mock corruption, and boundary edge assertions.
- Forensic Auditor: Verify zero hardcoding, zero fake passes, authentic logic validation.

## Step 5: Publication & Completion
- Write `TEST_READY.md` at project root `c:\Users\User\Documents\cafechi\TEST_READY.md`.
- Write `handoff.md` in working directory.
- Send notification message to parent orchestrator.
