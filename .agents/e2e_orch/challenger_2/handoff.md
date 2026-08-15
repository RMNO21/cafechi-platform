# Empirical Challenge Report: E2E Testing Track (Challenger 2)

**Track**: E2E Testing Track (M4)  
**Agent**: Challenger 2 (`challenger_2` — critic, specialist)  
**Parent**: E2E Testing Track Orchestrator (`0758dded-0032-42c5-9696-94e1821243ff`)  
**Verdict**: **REQUEST_CHANGES**  
**Date**: 2026-08-16  

---

## 1. Observation

1. **Test Runner Failure (`npx tsx tests/runner.ts`)**:
   - Command execution: `npx tsx tests/runner.ts`
   - Exit code: `1`
   - Failure output:
     ```text
     prisma:error 
     Invalid `db.order.create()` invocation in
     C:\Users\User\Documents\cafechi\src\app\api\orders\route.ts:94:34

       91     ? "CONFIRMED"
       92     : "PENDING_PAYMENT";
       93 
     → 94 const order = await db.order.create(
     Unique constraint failed on the fields: (`orderCode`)
     [ORDERS/POST] PrismaClientKnownRequestError: 
     ...
       code: 'P2002',
       meta: {
         modelName: 'Order',
         driverAdapterError: DriverAdapterError: UniqueConstraintViolation
       }
       ✗ FAIL T4.2 Scenario 2: High-Volume Morning Rush Simulation (5 Concurrent Orders) (105ms)
         ↳ Expected 201, but received 500
     
     ══════════════════════════════════════════════════════════════════════════════
                  CafeChi E2E 4-Tier Test Suite Summary Report             
     ══════════════════════════════════════════════════════════════════════════════
     TOTAL:   141 tests | 140 passed | 1 failed | Duration: 5194ms
     Result:  1 OF 141 TESTS FAILED
     ```

2. **Order Code Generation in `src/app/api/orders/route.ts`**:
   - Lines 8–13:
     ```typescript
     function generateOrderCode(): string {
       const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
       const letter = letters[Math.floor(Math.random() * letters.length)];
       const num = Math.floor(Math.random() * 900 + 100);
       return `${letter}-${num}`;
     }
     ```
   - Lines 94–105:
     ```typescript
     const order = await db.order.create({
       data: {
         cafeId,
         tableId: tableId ?? null,
         customerId: session?.sub ?? null,
         orderCode: generateOrderCode(),
         ...
     ```
   - `prisma/schema.prisma` Line 203:
     ```prisma
     orderCode      String   @unique
     ```
   - Total random code space is only $24 \times 900 = 21,600$ possibilities with zero collision retry loop. Under concurrent order placement or across sequential test executions on `prisma/dev.db`, collisions trigger unhandled `P2002` Prisma exceptions returning HTTP 500.

3. **KDS SSE Event Queue Truncation Desynchronization**:
   - `src/app/api/kds/stream/[cafeSlug]/route.ts` Lines 81–92:
     ```typescript
     const events = global.__kdsEvents?.[cafeId] ?? [];
     if (events.length > lastIndex) {
       const newEvents = events.slice(lastIndex);
       lastIndex = events.length;

       // Trim old events to prevent memory leak
       if (events.length > 500 && global.__kdsEvents) {
         global.__kdsEvents[cafeId] = events.slice(-100);
         lastIndex = global.__kdsEvents[cafeId].length;
       }
     ```
   - `global.__kdsEvents[cafeId]` is a shared in-memory array across all concurrent SSE client connections.
   - Empirical test result from `.agents/e2e_orch/challenger_2/stress_harness.ts`: When connection A is at `lastIndex = 490` and connection B triggers truncation to length 100, connection A's subsequent `events.slice(490)` evaluates to `[]` and `events.length > lastIndex` (100 > 490) evaluates to `false`, causing connection A to drop 15 events and permanently freeze until >400 more events are appended.

4. **Table Service Loose OR Query Assignment**:
   - `src/app/api/table-service/route.ts` Lines 23–35:
     ```typescript
     let resolvedTableId = tableId;
     const existingTable = await db.table.findFirst({
       where: {
         OR: [
           { id: tableId },
           { cafeId, tableNumber },
           { cafeId },
         ],
       },
     });

     if (existingTable) {
       resolvedTableId = existingTable.id;
     }
     ```
   - The `{ cafeId }` clause matches the first table in the cafe indiscriminately when an unrecognized `tableId` or `tableNumber` is submitted, incorrectly attributing table service requests to table 1 instead of leaving it unlinked or rejecting invalid table IDs.

5. **TypeScript Compiler Check**:
   - Command: `npx tsc --noEmit`
   - Exit code: `0` (Clean typecheck).

---

## 2. Logic Chain

1. **Step 1: Test Suite Exit Code Gate**:
   - The test runner `tests/runner.ts` must exit with code 0 (all 141 tests passing) for the track to be approved.
   - Observation 1 proves that `npx tsx tests/runner.ts` exits with code 1 due to a failure in Tier 4 (`T4.2 Scenario 2` or `T4.3 Scenario 3`).
2. **Step 2: Root Cause Analysis for Order Placement Failure**:
   - Observation 2 demonstrates that `generateOrderCode()` has inadequate entropy (21,600 combinations) and lacks a collision retry loop.
   - When orders are created concurrently or repeatedly, SQLite encounters a unique constraint violation on `Order.orderCode`. The route handler catches this as an unhandled error and responds with HTTP 500, causing test assertions (`assertEqual(res.status, 201)`) to fail.
3. **Step 3: Concurrency & Stream Processing Hazards**:
   - Observation 3 proves empirically that multi-client SSE stream processing suffers from shared state index corruption when the event array is mutated in place.
   - Observation 4 proves that table service requests are vulnerable to accidental table assignment due to a loose OR filter.
4. **Step 4: Synthesis & Assessment**:
   - Because the test suite fails execution (`npx tsx tests/runner.ts` exits with code 1) and critical concurrency/stream bugs exist in order code generation and SSE queue management, the track cannot be approved in its current state.

---

## 3. Caveats

- Tier 1 (60/60 tests), Tier 2 (60/60 tests), and Tier 3 (15/15 tests) pass all assertions consistently when run in isolation.
- TypeScript compiler passes with 0 errors (`npx tsc --noEmit`).
- No changes were made to implementation code in accordance with the Review-Only constraint.

---

## 4. Conclusion & Required Changes

**Verdict**: **REQUEST_CHANGES**

### Required Fixes:
1. **Fix `orderCode` Generation & Collision Handling** (`src/app/api/orders/route.ts`):
   - Increase entropy in `generateOrderCode()` (e.g. Include timestamp or millisecond suffix like `${letter}-${num}-${Date.now().toString().slice(-4)}` or random hex).
   - Add a retry loop on Prisma `P2002` error when creating orders, or generate collision-proof codes.
2. **Fix KDS SSE Event Queue Management** (`src/app/api/kds/stream/[cafeSlug]/route.ts`):
   - Do NOT mutate `global.__kdsEvents[cafeId]` directly inside per-connection intervals, or use an EventEmitter / PubSub model / connection listener registry to broadcast events directly without index-based slicing of a mutated array.
3. **Fix Table Service Query Filter** (`src/app/api/table-service/route.ts`):
   - Remove `{ cafeId }` from the `OR` array so that invalid table lookups do not accidentally match and hijack table 1.

---

## 5. Verification Method

To independently verify these findings:

```bash
# 1. Run the master E2E test runner (reproduces Tier 4 failure)
npx tsx tests/runner.ts

# 2. Run Tier 4 specifically
npx tsx tests/runner.ts --tier=4

# 3. Run Challenger 2 empirical concurrency & stress harness
npx tsx .agents/e2e_orch/challenger_2/stress_harness.ts

# 4. Verify TypeScript compilation
npx tsc --noEmit
```
