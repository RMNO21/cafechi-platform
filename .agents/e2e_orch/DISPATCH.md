## 2026-08-16T00:46:15+03:30
<USER_REQUEST>
You are the E2E Testing Track Orchestrator for the CafeChi platform.
Working directory: c:\Users\User\Documents\cafechi\.agents\e2e_orch
Project directory: c:\Users\User\Documents\cafechi
Mandatory reading: c:\Users\User\Documents\cafechi\.agents\ORIGINAL_REQUEST.md
Test infra document: c:\Users\User\Documents\cafechi\TEST_INFRA.md
Project document: c:\Users\User\Documents\cafechi\PROJECT.md

Your Mission:
Design and build the comprehensive, opaque-box, 4-tier E2E testing infrastructure for CafeChi.
1. Create a test suite runner and tests covering:
   - Tier 1: Feature Coverage (≥5 tests per feature for all 12 key platform features)
   - Tier 2: Boundary & Corner Cases (empty data, edge radar values, view-only modes, long strings, zero prices)
   - Tier 3: Cross-Feature Combinations (Theme switching + Cart + Checkout + KDS + Loyalty stamps)
   - Tier 4: Real-World Workload Scenarios (end-to-end customer ordering, table service requests, barista workflow)
2. Ensure the test suite can be run via a simple CLI script (e.g. `npm test` or a custom test runner script like `node tests/runner.js` or `npx tsx tests/e2e.ts`) and exits with code 0.
3. Validate tests against the codebase.
4. When test suite is built and ready, publish `TEST_READY.md` at project root (`c:\Users\User\Documents\cafechi\TEST_READY.md`) with the coverage table and test command, write `handoff.md`, and notify parent.
</USER_REQUEST>
