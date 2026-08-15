import { db } from "@/lib/db";
import { POST as createOrder } from "@/app/api/orders/route";
import { PATCH as patchOrderItem } from "@/app/api/orders/items/[orderItemId]/route";
import { POST as createTableService } from "@/app/api/table-service/route";
import { setAuthSession, createMockRequest } from "@/../tests/harness";

interface StressResult {
  testName: string;
  passed: boolean;
  details: string;
  metrics?: Record<string, any>;
}

const results: StressResult[] = [];

async function runEmpiricalChallenges() {
  console.log("===============================================================");
  console.log("  CHALLENGER 2 EMPIRICAL STRESS & CONCURRENCY HARNESS");
  console.log("===============================================================\n");

  const cafe = await db.cafe.findFirst({
    where: { slug: "roastery-collective" },
    include: { tables: true, menuItems: { where: { isAvailable: true } } },
  });
  if (!cafe || cafe.menuItems.length < 2) {
    throw new Error("Cafe or menu items not found for testing");
  }

  // --------------------------------------------------------------------------
  // STRESS TEST 1: High-Concurrency Order Placement (Unique OrderCode Collision)
  // --------------------------------------------------------------------------
  console.log("▶ [Stress 1] High-Concurrency Order Placement (30 parallel orders)...");
  {
    const CONCURRENCY = 30;
    const item = cafe.menuItems[0];
    const orderPromises = Array.from({ length: CONCURRENCY }, (_, i) =>
      createOrder(
        createMockRequest("/api/orders", {
          method: "POST",
          body: {
            cafeId: cafe.id,
            paymentMode: "PAY_UPFRONT_BUZZER",
            items: [{ menuItemId: item.id, quantity: 1, selectedModifiers: [] }],
            customerNotes: `Concurrent Stress #${i + 1}`,
          },
        })
      )
    );

    const responses = await Promise.all(orderPromises);
    const statuses = responses.map((r) => r.status);
    const successes = statuses.filter((s) => s === 201).length;
    const failures = statuses.filter((s) => s !== 201).length;

    console.log(`  Results: ${successes} succeeded (201), ${failures} failed (${statuses.filter(s => s !== 201).join(", ") || "none"})`);
    
    results.push({
      testName: "High-Concurrency Order Placement (30 parallel orders)",
      passed: failures === 0,
      details: failures === 0 ? "All 30 parallel orders placed successfully" : `${failures} of ${CONCURRENCY} orders failed due to code collision / constraint error`,
      metrics: { concurrency: CONCURRENCY, successes, failures, statuses },
    });
  }

  // --------------------------------------------------------------------------
  // STRESS TEST 2: Concurrent Station Item Updates (Race Condition on Auto-READY)
  // --------------------------------------------------------------------------
  console.log("\n▶ [Stress 2] Concurrent Station Item Updates -> Auto-READY Race Condition...");
  {
    let raceConditionCount = 0;
    const TRIALS = 10;

    for (let trial = 0; trial < TRIALS; trial++) {
      // Create order with 2 items
      const orderRes = await createOrder(
        createMockRequest("/api/orders", {
          method: "POST",
          body: {
            cafeId: cafe.id,
            paymentMode: "TABLE_TAB_SPLIT",
            items: [
              { menuItemId: cafe.menuItems[0].id, quantity: 1, selectedModifiers: [] },
              { menuItemId: cafe.menuItems[1].id, quantity: 1, selectedModifiers: [] },
            ],
          },
        })
      );

      if (orderRes.status !== 201) {
        console.log(`  Trial ${trial + 1}: Order creation failed (${orderRes.status})`);
        continue;
      }

      const orderJson = await orderRes.json();
      const orderId = orderJson.data.id;
      const item1Id = orderJson.data.orderItems[0].id;
      const item2Id = orderJson.data.orderItems[1].id;

      await setAuthSession("STAFF", cafe.id);

      // Simulate simultaneous completion from 2 barista stations
      await Promise.all([
        patchOrderItem(
          createMockRequest(`/api/orders/items/${item1Id}`, {
            method: "PATCH",
            body: { stationStatus: "DONE" },
          }),
          { params: Promise.resolve({ orderItemId: item1Id }) }
        ),
        patchOrderItem(
          createMockRequest(`/api/orders/items/${item2Id}`, {
            method: "PATCH",
            body: { stationStatus: "DONE" },
          }),
          { params: Promise.resolve({ orderItemId: item2Id }) }
        ),
      ]);

      // Check order status
      const finalOrder = await db.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      const allItemsDone = finalOrder?.orderItems.every((i) => i.stationStatus === "DONE");
      if (allItemsDone && finalOrder?.status !== "READY") {
        raceConditionCount++;
        console.log(`  Trial ${trial + 1}: RACE DETECTED! Both items DONE but order status remains "${finalOrder?.status}" instead of "READY"`);
      }
    }

    console.log(`  Total Trials: ${TRIALS}, Race Conditions Detected: ${raceConditionCount}`);
    results.push({
      testName: "Concurrent Station Item Completion (Auto-READY race condition)",
      passed: raceConditionCount === 0,
      details: raceConditionCount === 0 ? "All trials transitioned to READY cleanly" : `${raceConditionCount} of ${TRIALS} trials suffered race condition leaving order in CONFIRMED/PENDING state despite all items DONE`,
      metrics: { trials: TRIALS, races: raceConditionCount },
    });
  }

  // --------------------------------------------------------------------------
  // STRESS TEST 3: KDS SSE Global Event Queue Corruption under Multi-Client Truncation
  // --------------------------------------------------------------------------
  console.log("\n▶ [Stress 3] KDS SSE Global Event Queue Multi-Client Truncation Corruption...");
  {
    // Simulate global event queue behavior directly as implemented in route.ts
    const cafeId = "test-cafe-" + Date.now();
    (global as any).__kdsEvents = (global as any).__kdsEvents ?? {};
    (global as any).__kdsEvents[cafeId] = [];

    // Client 1 connects when 490 events exist
    for (let i = 0; i < 490; i++) {
      (global as any).__kdsEvents[cafeId].push({ type: "TEST", id: i });
    }
    let client1LastIndex = 490;

    // 15 more events arrive -> total 505 events
    for (let i = 490; i < 505; i++) {
      (global as any).__kdsEvents[cafeId].push({ type: "TEST", id: i });
    }

    // Client 2 connects or polls and triggers truncation (events.length > 500)
    const events = (global as any).__kdsEvents[cafeId];
    if (events.length > 500) {
      (global as any).__kdsEvents[cafeId] = events.slice(-100);
    }

    // Now Client 1 tries to read new events
    const updatedEvents = (global as any).__kdsEvents[cafeId];
    const client1NewEvents = updatedEvents.slice(client1LastIndex);

    // In a correct queue, Client 1 should get the 15 events (490..504).
    // But because updatedEvents was truncated to length 100, updatedEvents.slice(490) is []!
    console.log(`  Client 1 expected 15 events, but received: ${client1NewEvents.length} events`);
    console.log(`  Updated queue length: ${updatedEvents.length}, Client 1 lastIndex: ${client1LastIndex}`);

    const queueBroken = client1NewEvents.length === 0;
    results.push({
      testName: "KDS SSE Global Array Mutation on Multi-Client Connections",
      passed: !queueBroken,
      details: queueBroken
        ? "Global array mutation `global.__kdsEvents[cafeId] = events.slice(-100)` invalidates other active connections' `lastIndex`, causing silent event loss and connection freeze"
        : "Event delivery intact",
      metrics: { expectedEvents: 15, receivedEvents: client1NewEvents.length },
    });
  }

  // --------------------------------------------------------------------------
  // STRESS TEST 4: Loyalty Stamp Concurrent Increment
  // --------------------------------------------------------------------------
  console.log("\n▶ [Stress 4] Loyalty Stamp Concurrent Increment (5 parallel orders by same user)...");
  {
    const customer = await db.user.create({
      data: {
        phone: `0930${Math.floor(1000000 + Math.random() * 9000000)}`,
        passwordHash: "hash",
        fullName: "کاربر تست همزمانی",
        role: "CUSTOMER",
      },
    });

    await setAuthSession("CUSTOMER", cafe.id, { sub: customer.id, phone: customer.phone });

    const CONCURRENT_ORDERS = 5;
    const stampPromises = Array.from({ length: CONCURRENT_ORDERS }, () =>
      createOrder(
        createMockRequest("/api/orders", {
          method: "POST",
          body: {
            cafeId: cafe.id,
            paymentMode: "PAY_UPFRONT_BUZZER",
            items: [{ menuItemId: cafe.menuItems[0].id, quantity: 1, selectedModifiers: [] }],
          },
        })
      )
    );

    const responses = await Promise.all(stampPromises);
    const successfulOrders = responses.filter((r) => r.status === 201).length;

    const finalStamp = await db.loyaltyStamp.findUnique({
      where: { userId_cafeId: { userId: customer.id, cafeId: cafe.id } },
    });

    console.log(`  Successful orders: ${successfulOrders}/${CONCURRENT_ORDERS}`);
    console.log(`  Final stamp count: ${finalStamp?.stampsCount} (expected: ${successfulOrders})`);

    const stampAccurate = finalStamp?.stampsCount === successfulOrders;
    results.push({
      testName: "Loyalty Stamp Concurrent Increment Accuracy",
      passed: stampAccurate,
      details: stampAccurate
        ? `Accurately recorded ${finalStamp?.stampsCount} stamps for ${successfulOrders} orders`
        : `Stamp count mismatch: got ${finalStamp?.stampsCount}, expected ${successfulOrders}`,
      metrics: { successfulOrders, finalStamps: finalStamp?.stampsCount },
    });
  }

  // --------------------------------------------------------------------------
  // STRESS TEST 5: Table Service OR Query Ambiguity Bug
  // --------------------------------------------------------------------------
  console.log("\n▶ [Stress 5] Table Service Request Fallback to Wrong Table...");
  {
    // Submit table service request for a non-existent table ID "table-ghost"
    const req = createMockRequest("/api/table-service", {
      method: "POST",
      body: {
        cafeId: cafe.id,
        tableId: "non-existent-table-id-999",
        tableNumber: "999",
        requestType: "CALL_WAITER",
        note: "تست میز ارواح",
      },
    });

    const res = await createTableService(req);
    const json = await res.json();
    const createdReq = await db.tableServiceRequest.findUnique({ where: { id: json.data.id } });

    // Because of `{ cafeId }` in OR condition, it matched the FIRST table of the cafe!
    const firstTable = cafe.tables[0];
    const hijacked = createdReq?.tableId === firstTable.id && firstTable.id !== "non-existent-table-id-999";

    console.log(`  Submitted tableId: non-existent-table-id-999`);
    console.log(`  Resolved tableId: ${createdReq?.tableId} (First cafe table: ${firstTable?.id})`);
    console.log(`  Table hijacked by loose OR clause: ${hijacked}`);

    results.push({
      testName: "Table Service Fallback Hijack via Loose OR query",
      passed: !hijacked,
      details: hijacked
        ? "Loose `{ cafeId }` in `db.table.findFirst` OR condition matches the cafe's first table when tableId/tableNumber don't exist, assigning invalid table requests to table 1"
        : "Correct table resolution",
      metrics: { submittedTableId: "non-existent-table-id-999", resolvedTableId: createdReq?.tableId },
    });
  }

  console.log("\n===============================================================");
  console.log("  SUMMARY OF EMPIRICAL FINDINGS");
  console.log("===============================================================");
  for (const r of results) {
    console.log(`${r.passed ? "✓ PASS" : "✗ FAIL"} | ${r.testName}`);
    console.log(`  ↳ ${r.details}`);
  }
}

runEmpiricalChallenges().catch((err) => {
  console.error("Fatal error in stress harness:", err);
  process.exit(1);
});
