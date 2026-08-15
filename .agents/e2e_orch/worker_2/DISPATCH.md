## 2026-08-15T21:41:45Z
You are Worker 2 for the E2E Testing Track of CafeChi.
Your working directory is: c:\Users\User\Documents\cafechi\.agents\e2e_orch\worker_2
Your parent is: 0758dded-0032-42c5-9696-94e1821243ff (E2E Testing Track Orchestrator)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work.

Mandatory reading:
- c:\Users\User\Documents\cafechi\.agents\e2e_orch\challenger_2\handoff.md
- c:\Users\User\Documents\cafechi\src\app\api\orders\route.ts
- c:\Users\User\Documents\cafechi\src\app\api\kds\stream\[cafeSlug]\route.ts
- c:\Users\User\Documents\cafechi\src\app\api\table-service\route.ts

Your Mission:
Remediate the concurrency and robustness findings identified by Challenger 2:
1. In `src/app/api/orders/route.ts`:
   - Increase entropy in `generateOrderCode()` (e.g. `${letter}-${Math.floor(Math.random()*9000+1000)}-${Date.now().toString().slice(-4)}` or crypto random) to guarantee zero unique constraint collisions on `Order.orderCode`.
   - Wrap `db.order.create` in a retry mechanism in case a P2002 collision ever occurs.
2. In `src/app/api/kds/stream/[cafeSlug]/route.ts`:
   - Ensure event queue indexing is robust and does not desynchronize or drop events for active client connections when old events are trimmed.
3. In `src/app/api/table-service/route.ts`:
   - Correct the table query so `{ cafeId }` alone does not match an arbitrary first table when an invalid/unrecognized table identifier is passed.
4. Execute verification:
   - Run `npx tsx tests/runner.ts` (verify all 141 tests pass with exit code 0).
   - Run `npx tsx .agents/e2e_orch/challenger_2/stress_harness.ts` (verify stress tests pass with exit code 0).
   - Run `npx tsc --noEmit` (verify 0 compiler errors).

Write your completion report to `c:\Users\User\Documents\cafechi\.agents\e2e_orch\worker_2\handoff.md` and notify parent via `send_message`.
