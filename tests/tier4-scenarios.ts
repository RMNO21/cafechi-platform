import { db } from "@/lib/db";
import { getTheme } from "@/lib/themes";
import {
  assert,
  assertEqual,
  assertDefined,
  assertInRange,
  setTestScope,
  describe,
  it,
  createMockRequest,
  setAuthSession,
} from "./harness";

// Route handlers
import { GET as getDiscovery } from "@/app/api/discovery/route";
import { GET as getMenu } from "@/app/api/menu/[cafeSlug]/route";
import { GET as getTheUsual } from "@/app/api/the-usual/[cafeSlug]/route";
import { POST as createOrder } from "@/app/api/orders/route";
import { GET as getOrderById, PATCH as patchOrder } from "@/app/api/orders/[orderId]/route";
import { PATCH as patchOrderItem } from "@/app/api/orders/items/[orderItemId]/route";
import { POST as createTableService, PATCH as patchTableService } from "@/app/api/table-service/route";
import { POST as registerUser } from "@/app/api/auth/register/route";
import { PATCH as patchAdminCafe } from "@/app/api/admin/cafes/[cafeId]/route";
import { POST as createOwnerMenuItem } from "@/app/api/owner/menu/route";
import { PATCH as toggleStock } from "@/app/api/stock/route";

export function registerTier4Tests(): void {
  setTestScope(4);
  describe("Tier 4: Real-World Workload Scenarios (6 Complete Workflows)", () => {
    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 1: Complete Specialty Cafe Dine-In Workflow
    // ─────────────────────────────────────────────────────────────────────────
    it("Scenario 1: Complete Specialty Cafe Dine-In Workflow", async () => {
      // Step 1: Customer opens Discovery & finds Roastery Collective
      const discReq = createMockRequest("/api/discovery?q=%D8%B1%D9%88%D8%B3%D8%AA%D8%B1%DB%8C");
      const discRes = await getDiscovery(discReq);
      assertEqual(discRes.status, 200);
      const discJson = await discRes.json();
      const cafe = discJson.data[0];
      assertEqual(cafe.slug, "roastery-collective");

      // Step 2: Customer loads menu & verifies NORDIC_MINIMAL theme tokens
      const menuReq = createMockRequest(`/api/menu/${cafe.slug}`);
      const menuRes = await getMenu(menuReq, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const menuJson = await menuRes.json();
      assertEqual(menuJson.data.themeId, "NORDIC_MINIMAL");
      const theme = getTheme(menuJson.data.themeId);
      assertEqual(theme.cssVars["--theme-bg"], "#F6F3EE");

      // Step 3: Customer inspects specialty coffee with flavor radar
      const items = menuJson.data.categories.flatMap((c: any) => c.menuItems);
      const coffeeItem = items.find((i: any) => i.coffeeProfile !== null) ?? items[0];
      assertDefined(coffeeItem);

      // Step 4: Customer customizes order (Double Shot + Oat Milk) & adds Pastry
      const pastryItem = items.find((i: any) => i.id !== coffeeItem.id) ?? items[1] ?? coffeeItem;
      const orderReq = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [
            {
              menuItemId: coffeeItem.id,
              quantity: 1,
              selectedModifiers: [{ id: "m-oat", name: "شیر بادام", priceDelta: 15000 }],
            },
            {
              menuItemId: pastryItem.id,
              quantity: 1,
              selectedModifiers: [],
            },
          ],
        },
      });

      const orderRes = await createOrder(orderReq);
      assertEqual(orderRes.status, 201);
      const orderData = (await orderRes.json()).data;
      assertDefined(orderData.buzzerNumber);
      assertInRange(orderData.buzzerNumber, 1, 99);

      // Step 5: Mock Payment Gateway confirms payment
      await setAuthSession("CAFE_OWNER", cafe.id);
      const payReq = createMockRequest(`/api/orders/${orderData.id}`, {
        method: "PATCH",
        body: { status: "CONFIRMED" },
      });
      const payRes = await patchOrder(payReq, { params: Promise.resolve({ orderId: orderData.id }) });
      assertEqual(payRes.status, 200);

      // Step 6: Barista prepares all items
      await setAuthSession("STAFF", cafe.id);
      for (const item of orderData.orderItems) {
        const itemPatch = createMockRequest(`/api/orders/items/${item.id}`, {
          method: "PATCH",
          body: { stationStatus: "DONE" },
        });
        await patchOrderItem(itemPatch, { params: Promise.resolve({ orderItemId: item.id }) });
      }

      // Step 7: Order automatically transitions to READY
      const finalOrder = await db.order.findUnique({ where: { id: orderData.id } });
      assertDefined(finalOrder);
      assertEqual(finalOrder.status, "READY");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 2: High-Volume Morning Rush Simulation
    // ─────────────────────────────────────────────────────────────────────────
    it("Scenario 2: High-Volume Morning Rush Simulation (5 Concurrent Orders)", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const items = await db.menuItem.findMany({ where: { cafeId: cafe.id, isAvailable: true }, take: 3 });
      assert(items.length >= 1);

      // Place 5 simultaneous orders
      const orderPromises = [1, 2, 3, 4, 5].map((i) =>
        createOrder(
          createMockRequest("/api/orders", {
            method: "POST",
            body: {
              cafeId: cafe.id,
              paymentMode: "PAY_UPFRONT_BUZZER",
              items: [{ menuItemId: items[0].id, quantity: 1, selectedModifiers: [] }],
              customerNotes: `Rush order #${i}`,
            },
          })
        )
      );

      const orderResponses = await Promise.all(orderPromises);
      for (const res of orderResponses) {
        assertEqual(res.status, 201);
      }

      const createdOrders = await Promise.all(orderResponses.map((r) => r.json()));

      // Process all items in parallel across stations
      await setAuthSession("STAFF", cafe.id);
      const itemUpdatePromises = createdOrders.flatMap((orderJson) =>
        orderJson.data.orderItems.map((oi: any) =>
          patchOrderItem(
            createMockRequest(`/api/orders/items/${oi.id}`, {
              method: "PATCH",
              body: { stationStatus: "DONE" },
            }),
            { params: Promise.resolve({ orderItemId: oi.id }) }
          )
        )
      );

      const updateResponses = await Promise.all(itemUpdatePromises);
      for (const res of updateResponses) {
        assertEqual(res.status, 200);
      }

      // Verify all orders are READY
      const orderIds = createdOrders.map((o) => o.data.id);
      const updatedOrders = await db.order.findMany({ where: { id: { in: orderIds } } });
      assertEqual(updatedOrders.length, 5);
      for (const ord of updatedOrders) {
        assertEqual(ord.status, "READY");
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 3: Digital Loyalty Lifecycle & Favorite Reorder
    // ─────────────────────────────────────────────────────────────────────────
    it("Scenario 3: Digital Loyalty Lifecycle & Favorite Reorder", async () => {
      // Create dedicated customer
      const phone = `0935${Math.floor(1000000 + Math.random() * 9000000)}`;
      const regReq = createMockRequest("/api/auth/register", {
        method: "POST",
        body: { phone, password: "password123", fullName: "مشتری وفادار", role: "CUSTOMER" },
      });
      const regRes = await registerUser(regReq);
      assertEqual(regRes.status, 201);
      const customer = (await regRes.json()).data;

      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const item = await db.menuItem.findFirst({ where: { cafeId: cafe.id, isAvailable: true } });
      assertDefined(item);

      // Customer places 5 delivered orders to accumulate 5 stamps
      for (let i = 1; i <= 5; i++) {
        await db.order.create({
          data: {
            cafeId: cafe.id,
            customerId: customer.id,
            orderCode: `LOY-${i}-${Date.now().toString().slice(-3)}`,
            status: "DELIVERED",
            paymentMode: "PAY_UPFRONT_BUZZER",
            paymentStatus: "PAID",
            subtotalAmount: item.price,
            totalAmount: item.price,
            orderItems: {
              create: [{ itemId: item.id, quantity: 1, unitPrice: item.price, totalPrice: item.price, stationStatus: "DONE" }],
            },
          },
        });
      }

      // Set loyalty record to 5 stamps
      await db.loyaltyStamp.upsert({
        where: { userId_cafeId: { userId: customer.id, cafeId: cafe.id } },
        create: { userId: customer.id, cafeId: cafe.id, stampsCount: 5, maxStamps: 6 },
        update: { stampsCount: 5 },
      });

      // Customer visits cafe -> Opens "The Usual" favorites widget
      await setAuthSession("CUSTOMER", cafe.id, { sub: customer.id, phone: customer.phone });
      const usualReq = createMockRequest(`/api/the-usual/${cafe.slug}`);
      const usualRes = await getTheUsual(usualReq, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const usualJson = await usualRes.json();
      assert(usualJson.data.length > 0);
      const favoriteItem = usualJson.data[0];
      assertEqual(favoriteItem.id, item.id);

      // Customer places 6th order via 1-click Quick Add
      const order6Req = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [{ menuItemId: favoriteItem.id, quantity: 1, selectedModifiers: [] }],
        },
      });
      const order6Res = await createOrder(order6Req);
      assertEqual(order6Res.status, 201);

      // Verify 6th stamp awarded
      const finalStamp = await db.loyaltyStamp.findUnique({
        where: { userId_cafeId: { userId: customer.id, cafeId: cafe.id } },
      });
      assertDefined(finalStamp);
      assertEqual(finalStamp.stampsCount, 6);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 4: Table Service Assistance & Split Bill Dining Experience
    // ─────────────────────────────────────────────────────────────────────────
    it("Scenario 4: Table Service Assistance & Split Bill Dining Experience", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const table = await db.table.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(table);
      const items = await db.menuItem.findMany({ where: { cafeId: cafe.id, isAvailable: true }, take: 2 });
      assert(items.length >= 2);

      // Step 1: Customer sits at Table and calls waiter via FAB
      const waiterReq = createMockRequest("/api/table-service", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          tableNumber: table.tableNumber,
          requestType: "CALL_WAITER",
          note: "راهنمایی در انتخاب دانه قهوه",
        },
      });
      const waiterRes = await createTableService(waiterReq);
      assertEqual(waiterRes.status, 201);
      const callId = (await waiterRes.json()).data.id;

      // Staff acknowledges and resolves call
      await setAuthSession("STAFF", cafe.id);
      const resolveCall = createMockRequest("/api/table-service", {
        method: "PATCH",
        body: { id: callId, status: "DONE" },
      });
      await patchTableService(resolveCall);

      // Step 2: Group orders multiple items on Table Tab
      const tabOrderReq = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          paymentMode: "TABLE_TAB_SPLIT",
          items: [
            { menuItemId: items[0].id, quantity: 2, selectedModifiers: [] },
            { menuItemId: items[1].id, quantity: 1, selectedModifiers: [] },
          ],
        },
      });
      const tabOrderRes = await createOrder(tabOrderReq);
      assertEqual(tabOrderRes.status, 201);
      const tabOrder = (await tabOrderRes.json()).data;
      assertEqual(tabOrder.status, "CONFIRMED");

      // Step 3: Customer requests POS terminal via FAB
      const posReq = createMockRequest("/api/table-service", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          tableId: table.id,
          tableNumber: table.tableNumber,
          requestType: "REQUEST_POS",
          note: "تقسیم دانگی فاکتور",
        },
      });
      const posRes = await createTableService(posReq);
      assertEqual(posRes.status, 201);
      const posReqId = (await posRes.json()).data.id;

      // Staff brings POS and resolves service request
      await setAuthSession("STAFF", cafe.id);
      await patchTableService(
        createMockRequest("/api/table-service", {
          method: "PATCH",
          body: { id: posReqId, status: "DONE" },
        })
      );

      // Order status transitions to DELIVERED
      await setAuthSession("CAFE_OWNER", cafe.id);
      const deliverRes = await patchOrder(
        createMockRequest(`/api/orders/${tabOrder.id}`, {
          method: "PATCH",
          body: { status: "DELIVERED" },
        }),
        { params: Promise.resolve({ orderId: tabOrder.id }) }
      );
      assertEqual(deliverRes.status, 200);
      assertEqual((await deliverRes.json()).data.status, "DELIVERED");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 5: Multi-Theme Cafe Onboarding & Admin Approval Flow
    // ─────────────────────────────────────────────────────────────────────────
    it("Scenario 5: Multi-Theme Cafe Onboarding & Admin Approval Flow", async () => {
      // Step 1: Cafe owner registers
      const ownerPhone = `0936${Math.floor(1000000 + Math.random() * 9000000)}`;
      const regReq = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          phone: ownerPhone,
          password: "password123",
          fullName: "صاحب کافه آرت ژورنال",
          role: "CAFE_OWNER",
        },
      });
      const regRes = await registerUser(regReq);
      assertEqual(regRes.status, 201);
      const owner = (await regRes.json()).data;

      // Step 2: Owner sets up Cafe with NEO_EDITORIAL theme
      const cafeSlug = `cafe-art-journal-${Date.now().toString().slice(-4)}`;
      const newCafe = await db.cafe.create({
        data: {
          ownerId: owner.id,
          name: "کافه آرت ژورنال",
          slug: cafeSlug,
          description: "فضای مینیمال با تایپوگرافی روزنامه‌ای و دانه‌های تخصصی",
          address: "تهران، خیابان کریمخان زند",
          latitude: 35.7195,
          longitude: 51.418,
          phoneNumber: "02188332211",
          themeId: "NEO_EDITORIAL",
          workflowMode: "PAY_UPFRONT_BUZZER",
          isApproved: false,
          isActive: true,
        },
      });

      const cat = await db.category.create({
        data: { cafeId: newCafe.id, name: "اسپشیالتی کافی", displayOrder: 1 },
      });

      // Add signature coffee item
      await setAuthSession("CAFE_OWNER", newCafe.id, { sub: owner.id, phone: owner.phone });
      const itemReq = createMockRequest("/api/owner/menu", {
        method: "POST",
        body: {
          categoryId: cat.id,
          title: "وی۶۰ گیشا پاناما",
          price: 180000,
          coffeeProfile: {
            origin: "Panama Boquete",
            altitude: "1800m",
            process: "Washed",
            roastLevel: "Light",
            radar: { acidity: 9.5, body: 6, sweetness: 9, bitterness: 1.5, aroma: 10 },
            flavorNotes: ["Jasmine", "Peach", "Bergamot"],
          },
          modifierGroups: [],
        },
      });
      const itemRes = await createOwnerMenuItem(itemReq);
      assertEqual(itemRes.status, 201);

      // Step 3: Super Admin logs in & approves cafe
      await setAuthSession("SUPER_ADMIN");
      const approveReq = createMockRequest(`/api/admin/cafes/${newCafe.id}`, {
        method: "PATCH",
        body: { isApproved: true },
      });
      const approveRes = await patchAdminCafe(approveReq, { params: Promise.resolve({ cafeId: newCafe.id }) });
      assertEqual(approveRes.status, 200);

      // Step 4: Cafe appears in public Discovery marketplace with NEO_EDITORIAL theme
      const discReq = createMockRequest("/api/discovery?q=%DA%98%D9%88%D8%B1%D9%86%D8%A7%D9%84");
      const discRes = await getDiscovery(discReq);
      const discJson = await discRes.json();
      const publicCafe = discJson.data.find((c: any) => c.id === newCafe.id);
      assertDefined(publicCafe);
      assertEqual(publicCafe.themeId, "NEO_EDITORIAL");
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 6: 86-Stock Depletion & Barista Live Intervention
    // ─────────────────────────────────────────────────────────────────────────
    it("Scenario 6: 86-Stock Depletion & Barista Live Intervention", async () => {
      const cafe = await db.cafe.findFirst({ where: { slug: "roastery-collective" } });
      assertDefined(cafe);
      const cat = await db.category.findFirst({ where: { cafeId: cafe.id } });
      assertDefined(cat);

      // Create specialty Cold Brew
      const coldBrew = await db.menuItem.create({
        data: {
          cafeId: cafe.id,
          categoryId: cat.id,
          title: "کلد برو نیتروژن تک‌خاستگاه",
          price: 95000,
          isAvailable: true,
        },
      });

      // Step 1: Inventory runs out -> Barista 86's the item
      await setAuthSession("STAFF", cafe.id);
      const toggleReq1 = createMockRequest("/api/stock", {
        method: "PATCH",
        body: { itemId: coldBrew.id, isAvailable: false },
      });
      const toggleRes1 = await toggleStock(toggleReq1);
      assertEqual(toggleRes1.status, 200);

      // Step 2: Customer menu reflects item as unavailable
      const menuReq1 = createMockRequest(`/api/menu/${cafe.slug}`);
      const menuRes1 = await getMenu(menuReq1, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const menuJson1 = await menuRes1.json();
      const items1 = menuJson1.data.categories.flatMap((c: any) => c.menuItems);
      assertEqual(items1.find((i: any) => i.id === coldBrew.id), undefined);

      // Step 3: Customer trying to order 86'd item gets rejected (400)
      const orderReq = createMockRequest("/api/orders", {
        method: "POST",
        body: {
          cafeId: cafe.id,
          paymentMode: "PAY_UPFRONT_BUZZER",
          items: [{ menuItemId: coldBrew.id, quantity: 1, selectedModifiers: [] }],
        },
      });
      const orderRes = await createOrder(orderReq);
      assertEqual(orderRes.status, 400);

      // Step 4: Barista brews fresh batch -> toggles stock back to available
      await setAuthSession("STAFF", cafe.id);
      const toggleReq2 = createMockRequest("/api/stock", {
        method: "PATCH",
        body: { itemId: coldBrew.id, isAvailable: true },
      });
      const toggleRes2 = await toggleStock(toggleReq2);
      assertEqual(toggleRes2.status, 200);

      // Step 5: Item is restored in customer menu
      const menuReq2 = createMockRequest(`/api/menu/${cafe.slug}`);
      const menuRes2 = await getMenu(menuReq2, { params: Promise.resolve({ cafeSlug: cafe.slug }) });
      const menuJson2 = await menuRes2.json();
      const items2 = menuJson2.data.categories.flatMap((c: any) => c.menuItems);
      const restored = items2.find((i: any) => i.id === coldBrew.id);
      assertDefined(restored, "Restored item must now be visible in customer menu");

      // Cleanup
      await db.menuItem.delete({ where: { id: coldBrew.id } });
    });
  });
}
